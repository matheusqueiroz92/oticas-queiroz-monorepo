import type { proto } from "@whiskeysockets/baileys";

const MAX_ENTRIES = 500;
const messageByKey = new Map<string, proto.IMessage>();

function cacheKey(remoteJid: string, id: string): string {
  return `${remoteJid}:${id}`;
}

export function storeMessageForRetry(
  remoteJid: string | null | undefined,
  id: string | null | undefined,
  message: proto.IMessage | null | undefined
): void {
  if (!remoteJid || !id || !message) return;

  const key = cacheKey(remoteJid, id);
  if (messageByKey.size >= MAX_ENTRIES) {
    const first = messageByKey.keys().next().value;
    if (first) messageByKey.delete(first);
  }
  messageByKey.set(key, message);
}

export async function getMessageForRetry(
  key: proto.IMessageKey
): Promise<proto.IMessage | undefined> {
  if (!key.remoteJid || !key.id) return undefined;
  return messageByKey.get(cacheKey(key.remoteJid, key.id));
}

export function clearRecentMessageCache(): void {
  messageByKey.clear();
}
