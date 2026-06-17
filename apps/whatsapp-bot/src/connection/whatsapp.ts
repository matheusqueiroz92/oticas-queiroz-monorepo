import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidNewsletter,
  isJidStatusBroadcast,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcode from "qrcode-terminal";
import path from "node:path";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { processInboundMessage } from "../services/inboundMessageService";
import { sendWhatsAppText } from "../services/whatsappSendService";
import type { InboundMessagePayload } from "../types/messages";
import {
  extractTextFromMessage,
  isIgnorableInboundJid,
  isProcessableUserMessage,
  toUnixTimestampSeconds,
} from "../utils/messageFilters";
import { getMessageForRetry, storeMessageForRetry } from "../utils/recentMessageCache";
import { backupSession } from "../utils/sessionBackup";

// ---------------------------------------------------------------------------
// Constantes de backoff exponencial
// ---------------------------------------------------------------------------
const MAX_RECONNECT_DELAY_MS = 60_000; // teto de 60 s entre tentativas

// ---------------------------------------------------------------------------
// Estado do módulo
// ---------------------------------------------------------------------------
const baileysLogger = pino({
  level:
    process.env.NODE_ENV === "test"
      ? "silent"
      : process.env.LOG_LEVEL === "debug"
        ? "debug"
        : "warn",
});

let socket: WASocket | null = null;
let isConnected = false;

/**
 * true enquanto uma tentativa de conexão está em andamento ou bem-sucedida.
 * Só volta a false quando scheduleReconnect() planeja a próxima tentativa,
 * evitando que múltiplos eventos connection.update disparem conexões paralelas.
 */
let isStarting = false;

/** Timer de reconexão em aberto — garante que só exista um por vez. */
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

/** Contador de tentativas consecutivas — base do backoff exponencial. */
let reconnectAttempts = 0;

/** Último QR Code recebido do Baileys, ou null quando conectado/não disponível. */
let currentQrCode: string | null = null;

// ---------------------------------------------------------------------------
// Exportações de estado
// ---------------------------------------------------------------------------
export function getWhatsAppSocket(): WASocket | null {
  return socket;
}

export function isWhatsAppConnected(): boolean {
  return isConnected;
}

/** Retorna o QR Code bruto atual para ser renderizado pelo endpoint HTTP /qr. */
export function getLatestQrCode(): string | null {
  return currentQrCode;
}

// ---------------------------------------------------------------------------
// Lógica de reconexão com backoff exponencial + jitter (fix C3)
// ---------------------------------------------------------------------------
function scheduleReconnect(): void {
  // Evita criar múltiplos timers quando vários eventos disparam em sequência
  if (reconnectTimer !== null) return;

  const baseDelay = env.WA_RECONNECT_DELAY_MS;
  const exponential = baseDelay * Math.pow(2, reconnectAttempts);
  const capped = Math.min(exponential, MAX_RECONNECT_DELAY_MS);
  const jitter = Math.random() * 1_000;
  const delay = Math.round(capped + jitter);

  reconnectAttempts++;
  logger.info(`Reconectando WhatsApp em ${delay}ms (tentativa ${reconnectAttempts})...`);

  // Libera a guarda para que a próxima chamada a startWhatsAppConnection() prossiga
  isStarting = false;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void startWhatsAppConnection();
  }, delay);
}

// ---------------------------------------------------------------------------
// Conexão principal
// ---------------------------------------------------------------------------
export async function startWhatsAppConnection(): Promise<void> {
  if (isStarting) return;
  isStarting = true;

  try {
    const sessionPath = path.resolve(process.cwd(), env.WA_SESSION_PATH);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
      },
      logger: baileysLogger,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      fireInitQueries: true,
      getMessage: getMessageForRetry,
      // Evita processar status, listas de transmissão e canais no messages.upsert
      shouldIgnoreJid: (jid) =>
        isJidStatusBroadcast(jid) ||
        isJidBroadcast(jid) ||
        isJidNewsletter(jid),
    });

    socket = sock;

    // Salva credenciais e faz backup a cada atualização (fix C2)
    sock.ev.on("creds.update", async () => {
      await saveCreds();
      void backupSession(sessionPath);
    });

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      // C1: armazena QR para o endpoint /qr em vez de apenas imprimir no terminal
      if (qr) {
        currentQrCode = qr;
        logger.info("QR Code disponível em GET /qr — escaneie com o WhatsApp:");
        qrcode.generate(qr, { small: true }); // mantém fallback no terminal
      }

      if (connection === "open") {
        isConnected = true;
        currentQrCode = null; // QR consumido
        reconnectAttempts = 0; // zera o backoff após conexão bem-sucedida
        logger.info("WhatsApp conectado com sucesso");
      }

      if (connection === "close") {
        isConnected = false;
        currentQrCode = null;
        socket = null;

        const statusCode = (lastDisconnect?.error as Boom | undefined)?.output
          ?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        logger.warn("Conexão WhatsApp encerrada", { statusCode, loggedOut });

        if (loggedOut) {
          // Agenda nova conexão para que um novo QR seja gerado (visível em /qr)
          logger.warn(
            "Sessão deslogada. Acesse GET /qr para reautenticar com um novo QR Code."
          );
        }

        // C3: scheduleReconnect garante timer único e backoff exponencial
        scheduleReconnect();
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid || isIgnorableInboundJid(remoteJid)) continue;
        if (!isProcessableUserMessage(msg)) continue;

        if (msg.key.id && msg.message) {
          storeMessageForRetry(remoteJid, msg.key.id, msg.message);
        }

        const text = extractTextFromMessage(msg.message);
        if (!text) {
          logger.debug("Mensagem ignorada (sem texto extraível)", {
            remoteJid,
            messageKeys: msg.message ? Object.keys(msg.message) : [],
          });
          continue;
        }

        const payload: InboundMessagePayload = {
          remoteJid,
          pushName: msg.pushName ?? "",
          text,
          timestamp: toUnixTimestampSeconds(msg.messageTimestamp),
        };

        // Log sem PII: apenas JID e comprimento do texto
        logger.info("Inbound WhatsApp", {
          remoteJid: payload.remoteJid,
          textLength: text.length,
        });

        try {
          const response = await processInboundMessage(payload);

          if (response?.text) {
            const outboundJid = await sendWhatsAppText(
              sock,
              payload.remoteJid,
              response.text,
              msg.key,
              msg
            );
            logger.info("Resposta enviada ao WhatsApp", {
              remoteJid: payload.remoteJid,
              outboundJid,
              textLength: response.text.length,
            });
          } else {
            logger.warn("Nenhuma resposta com text para enviar", {
              remoteJid: payload.remoteJid,
            });
          }
        } catch (err) {
          logger.error("Falha ao processar mensagem inbound", {
            remoteJid: payload.remoteJid,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    });

    // Nota: isStarting permanece true aqui intencionalmente.
    // Será resetado para false apenas por scheduleReconnect() quando necessário,
    // impedindo que múltiplos eventos connection.update disparem conexões paralelas.
  } catch (err) {
    logger.error("Erro ao iniciar conexão WhatsApp", {
      error: err instanceof Error ? err.message : String(err),
    });
    socket = null;
    isConnected = false;
    scheduleReconnect();
  }
}

export async function stopWhatsAppConnection(): Promise<void> {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.end(undefined);
    socket = null;
  }
  isConnected = false;
  isStarting = false;
  currentQrCode = null;
}
