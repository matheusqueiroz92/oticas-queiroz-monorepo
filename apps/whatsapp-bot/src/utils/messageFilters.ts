import type { proto } from "@whiskeysockets/baileys";

export function isGroupJid(remoteJid: string | null | undefined): boolean {
  if (!remoteJid) return false;
  return remoteJid.endsWith("@g.us");
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
