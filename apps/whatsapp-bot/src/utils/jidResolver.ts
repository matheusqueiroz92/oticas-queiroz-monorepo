import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../config/logger";

const S_WHATSAPP_NET = "@s.whatsapp.net";
const LID_SUFFIX = "@lid";
const MAX_ENTRIES = 500;

/** Mapeia JID @lid → @s.whatsapp.net aprendido nas mensagens recebidas. */
const lidToPhoneJidCache = new Map<string, string>();

/** Timer de escrita debounced — evita I/O excessivo em rajadas de mensagens. */
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let cachePersistPath: string | null = null;

// ---------------------------------------------------------------------------
// Persistência em disco (A5)
// ---------------------------------------------------------------------------

/**
 * Define o caminho do arquivo de cache e carrega mapeamentos salvos anteriormente.
 * Chamar uma vez na inicialização do processo.
 */
export async function loadLidCacheFromDisk(filePath: string): Promise<void> {
  cachePersistPath = filePath;
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const entries = JSON.parse(raw) as Array<[string, string]>;
    if (Array.isArray(entries)) {
      for (const [lid, phone] of entries) {
        if (typeof lid === "string" && typeof phone === "string") {
          lidToPhoneJidCache.set(lid, phone);
        }
      }
      logger.info("Cache LID→JID carregado do disco", {
        entries: lidToPhoneJidCache.size,
        filePath,
      });
    }
  } catch (err: unknown) {
    // ENOENT = arquivo ainda não existe (primeira execução) — silencioso
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.warn("Falha ao carregar cache LID→JID do disco", {
        filePath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/** Persiste o cache em disco com debounce de 2 s para evitar I/O excessivo. */
function schedulePersist(): void {
  if (!cachePersistPath || persistTimer !== null) return;
  persistTimer = setTimeout(async () => {
    persistTimer = null;
    if (!cachePersistPath) return;
    try {
      const entries = Array.from(lidToPhoneJidCache.entries());
      await fs.mkdir(path.dirname(cachePersistPath), { recursive: true });
      await fs.writeFile(cachePersistPath, JSON.stringify(entries), "utf-8");
    } catch (err) {
      logger.warn("Falha ao persistir cache LID→JID", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, 2_000);
}

// ---------------------------------------------------------------------------
// Operações do cache
// ---------------------------------------------------------------------------

export type OutboundJidKey = {
  senderPn?: string | null;
  participantPn?: string | null;
};

export function isLidJid(jid: string): boolean {
  return jid.endsWith(LID_SUFFIX);
}

export function isPhoneWhatsAppJid(jid: string): boolean {
  return jid.endsWith(S_WHATSAPP_NET);
}

export function rememberLidPhoneMapping(
  lidJid: string,
  phoneJid: string
): void {
  if (!isLidJid(lidJid) || !isPhoneWhatsAppJid(phoneJid)) return;

  // Eviction por tamanho antes de adicionar nova entrada
  if (!lidToPhoneJidCache.has(lidJid) && lidToPhoneJidCache.size >= MAX_ENTRIES) {
    const first = lidToPhoneJidCache.keys().next().value;
    if (first) lidToPhoneJidCache.delete(first);
  }

  lidToPhoneJidCache.set(lidJid, phoneJid);
  schedulePersist();
}

function normalizePn(pn: string | null | undefined): string | null {
  if (!pn || typeof pn !== "string") return null;
  const trimmed = pn.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) {
    return isPhoneWhatsAppJid(trimmed) ? trimmed : null;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  return `${digits}${S_WHATSAPP_NET}`;
}

/**
 * JID para envio de respostas.
 *
 * WhatsApp (privacidade / linked devices): se a mensagem veio em @lid, a resposta
 * deve ir para o **mesmo @lid**. Converter para @s.whatsapp.net quebra a sessão E2E
 * e o celular do cliente mostra "Aguardando mensagem".
 *
 * O mapeamento LID→telefone é mantido só para logs/CRM; não altera o destino do envio.
 */
export function resolveOutboundJid(
  remoteJid: string,
  key?: OutboundJidKey | null
): string {
  const senderPn = normalizePn(key?.senderPn);
  const participantPn = normalizePn(key?.participantPn);

  if (senderPn) rememberLidPhoneMapping(remoteJid, senderPn);
  if (participantPn) rememberLidPhoneMapping(remoteJid, participantPn);

  if (isLidJid(remoteJid)) {
    return remoteJid;
  }

  if (senderPn) return senderPn;
  if (participantPn) return participantPn;

  const cached = lidToPhoneJidCache.get(remoteJid);
  if (cached) return cached;

  return remoteJid;
}

export function getCachedPhoneJidForLid(lidJid: string): string | undefined {
  return lidToPhoneJidCache.get(lidJid);
}

/** Apenas para testes. */
export function clearLidPhoneCache(): void {
  lidToPhoneJidCache.clear();
}
