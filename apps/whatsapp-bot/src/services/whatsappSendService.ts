import type { WASocket } from "@whiskeysockets/baileys";
import { logger } from "../config/logger";
import { resolveOutboundJid, type OutboundJidKey } from "../utils/jidResolver";
import { storeMessageForRetry } from "../utils/recentMessageCache";

export async function sendWhatsAppText(
  sock: WASocket,
  remoteJid: string,
  text: string,
  key?: OutboundJidKey | null
): Promise<string> {
  const outboundJid = resolveOutboundJid(remoteJid, key);

  if (outboundJid !== remoteJid) {
    logger.info("Envio usando JID de telefone (mapeamento LID)", {
      remoteJid,
      outboundJid,
    });
  }

  const sent = await sock.sendMessage(outboundJid, { text });

  if (sent?.key?.id) {
    storeMessageForRetry(outboundJid, sent.key.id, sent.message);
    if (outboundJid !== remoteJid) {
      storeMessageForRetry(remoteJid, sent.key.id, sent.message);
    }
  }

  return outboundJid;
}
