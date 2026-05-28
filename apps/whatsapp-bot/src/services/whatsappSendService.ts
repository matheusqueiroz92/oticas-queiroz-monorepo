import type { proto, WASocket } from "@whiskeysockets/baileys";
import { logger } from "../config/logger";
import {
  getCachedPhoneJidForLid,
  isLidJid,
  resolveOutboundJid,
  type OutboundJidKey,
} from "../utils/jidResolver";
import { storeMessageForRetry } from "../utils/recentMessageCache";

export async function sendWhatsAppText(
  sock: WASocket,
  remoteJid: string,
  text: string,
  key?: OutboundJidKey | null,
  quotedMessage?: proto.IWebMessageInfo | null
): Promise<string> {
  const outboundJid = resolveOutboundJid(remoteJid, key);

  if (isLidJid(remoteJid)) {
    const phoneHint = getCachedPhoneJidForLid(remoteJid);
    logger.info("Envio na mesma conversa LID (E2E)", {
      remoteJid,
      phoneHint,
    });
  } else if (outboundJid !== remoteJid) {
    logger.info("Envio usando JID de telefone", {
      remoteJid,
      outboundJid,
    });
  }

  const sent = await sock.sendMessage(
    outboundJid,
    { text },
    quotedMessage ? { quoted: quotedMessage } : undefined
  );

  if (sent?.key?.id) {
    storeMessageForRetry(outboundJid, sent.key.id, sent.message);
    if (outboundJid !== remoteJid) {
      storeMessageForRetry(remoteJid, sent.key.id, sent.message);
    }
  }

  return outboundJid;
}
