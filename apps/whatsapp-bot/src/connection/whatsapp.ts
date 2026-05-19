import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
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
  isGroupJid,
  toUnixTimestampSeconds,
} from "../utils/messageFilters";
import { getMessageForRetry, storeMessageForRetry } from "../utils/recentMessageCache";

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
let isStarting = false;

export function getWhatsAppSocket(): WASocket | null {
  return socket;
}

export function isWhatsAppConnected(): boolean {
  return isConnected;
}

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
    });

    socket = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info("Escaneie o QR Code abaixo com o WhatsApp:");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        isConnected = true;
        logger.info("WhatsApp conectado");
      }

      if (connection === "close") {
        isConnected = false;
        const statusCode = (lastDisconnect?.error as Boom | undefined)?.output
          ?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        logger.warn("Conexão WhatsApp encerrada", {
          statusCode,
          loggedOut,
        });

        socket = null;

        if (loggedOut) {
          logger.error(
            "Sessão deslogada. Remova os arquivos em WA_SESSION_PATH e escaneie o QR novamente."
          );
          return;
        }

        logger.info(
          `Reconectando em ${env.WA_RECONNECT_DELAY_MS}ms...`
        );
        setTimeout(() => {
          isStarting = false;
          void startWhatsAppConnection();
        }, env.WA_RECONNECT_DELAY_MS);
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid || isGroupJid(remoteJid)) continue;

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

        logger.info("Inbound WhatsApp", {
          remoteJid: payload.remoteJid,
          senderPn: msg.key.senderPn,
          text: payload.text,
        });

        try {
          const response = await processInboundMessage(payload);

          if (response?.text) {
            const outboundJid = await sendWhatsAppText(
              sock,
              payload.remoteJid,
              response.text,
              msg.key
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
            text: payload.text,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    });
  } catch (err) {
    logger.error("Erro ao iniciar conexão WhatsApp", {
      error: err instanceof Error ? err.message : String(err),
    });
    socket = null;
    isConnected = false;

    setTimeout(() => {
      isStarting = false;
      void startWhatsAppConnection();
    }, env.WA_RECONNECT_DELAY_MS);
  } finally {
    isStarting = false;
  }
}

export async function stopWhatsAppConnection(): Promise<void> {
  if (socket) {
    socket.end(undefined);
    socket = null;
  }
  isConnected = false;
}
