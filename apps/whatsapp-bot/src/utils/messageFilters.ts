import type { proto } from "@whiskeysockets/baileys";

export function isGroupJid(remoteJid: string | null | undefined): boolean {
  if (!remoteJid) return false;
  return remoteJid.endsWith("@g.us");
}

function isStatusBroadcastJid(remoteJid: string): boolean {
  return remoteJid === "status@broadcast";
}

function isBroadcastJid(remoteJid: string): boolean {
  return remoteJid.endsWith("@broadcast");
}

function isNewsletterJid(remoteJid: string): boolean {
  return remoteJid.endsWith("@newsletter");
}

/** JIDs que não devem disparar o fluxo do chatbot (grupos, status, listas de transmissão, canais). */
export function isIgnorableInboundJid(
  remoteJid: string | null | undefined
): boolean {
  if (!remoteJid) return true;
  if (isGroupJid(remoteJid)) return true;
  if (isStatusBroadcastJid(remoteJid)) return true;
  if (isBroadcastJid(remoteJid)) return true;
  if (isNewsletterJid(remoteJid)) return true;
  return false;
}

/** Ignora stubs de protocolo, broadcasts e mensagens sem conteúdo de usuário. */
export function isProcessableUserMessage(msg: proto.IWebMessageInfo): boolean {
  if (!msg.message) return false;
  if (msg.messageStubType != null) return false;
  if (msg.broadcast) return false;
  if (msg.message.protocolMessage) return false;
  return true;
}

export function extractTextFromMessage(
  message: proto.IMessage | null | undefined
): string | null {
  if (!message) return null;

  if (message.conversation) {
    return message.conversation;
  }

  const extended = message.extendedTextMessage?.text;
  if (extended) {
    return extended;
  }

  return null;
}

export function toUnixTimestampSeconds(
  messageTimestamp: number | Long | null | undefined
): number {
  if (messageTimestamp == null) {
    return Math.floor(Date.now() / 1000);
  }

  const raw =
    typeof messageTimestamp === "object" &&
    messageTimestamp !== null &&
    "toNumber" in messageTimestamp
      ? (messageTimestamp as { toNumber: () => number }).toNumber()
      : Number(messageTimestamp);

  if (raw > 1_000_000_000_000) {
    return Math.floor(raw / 1000);
  }

  return Math.floor(raw);
}

/** Long type from protobufjs (Baileys dependency). */
type Long = { toNumber: () => number };
