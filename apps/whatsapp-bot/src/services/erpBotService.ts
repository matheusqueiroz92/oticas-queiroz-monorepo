import axios from "axios";
import { env } from "../config/env";
import { logger } from "../config/logger";
import type { InboundMessagePayload, N8nWebhookResponse } from "../types/messages";

export interface ErpBotChatResponse {
  action: string;
  text: string;
  sessionStatus?: string | null;
}

export async function forwardToErpBot(
  payload: InboundMessagePayload
): Promise<N8nWebhookResponse | null> {
  const baseUrl = env.ERP_API_URL.replace(/\/$/, "");
  const url = `${baseUrl}/api/bot/chat`;

  const { data } = await axios.post<ErpBotChatResponse>(
    url,
    {
      remoteJid: payload.remoteJid,
      text: payload.text,
    },
    {
      timeout: env.N8N_WEBHOOK_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.BOT_API_KEY,
      },
    }
  );

  // Log sem PII: apenas JID e campos de controle da sessão
  logger.info("Mensagem processada via ERP /api/bot/chat", {
    remoteJid: payload.remoteJid,
    action: data?.action,
    sessionStatus: data?.sessionStatus,
  });

  if (!data?.text) {
    logger.warn("ERP respondeu sem campo text", {
      remoteJid: payload.remoteJid,
      data,
    });
    return null;
  }

  return { text: data.text };
}
