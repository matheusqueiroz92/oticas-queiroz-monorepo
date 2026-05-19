const S_WHATSAPP_NET = "@s.whatsapp.net";
const LID_SUFFIX = "@lid";

export type OutboundJidKey = {
  senderPn?: string | null;
  participantPn?: string | null;
};

/** Mapeia JID @lid → @s.whatsapp.net aprendido nas mensagens recebidas. */
const lidToPhoneJidCache = new Map<string, string>();

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
  lidToPhoneJidCache.set(lidJid, phoneJid);
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
 * JID para envio de respostas. Contatos com privacidade (@lid) precisam do PN
 * (senderPn / participantPn) ou do cache; enviar só para @lid costuma falhar (PDO / offline).
 */
export function resolveOutboundJid(
  remoteJid: string,
  key?: OutboundJidKey | null
): string {
  const senderPn = normalizePn(key?.senderPn);
  if (senderPn) {
    rememberLidPhoneMapping(remoteJid, senderPn);
    return senderPn;
  }

  const participantPn = normalizePn(key?.participantPn);
  if (participantPn) {
    rememberLidPhoneMapping(remoteJid, participantPn);
    return participantPn;
  }

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
