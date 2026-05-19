import axios from "axios";
import { env } from "../config/env";
import { logger } from "../config/logger";
import type {
  InboundMessagePayload,
  N8nWebhookResponse,
} from "../types/messages";

export async function forwardInbound(
  payload: InboundMessagePayload
): Promise<N8nWebhookResponse | null> {
  const { data } = await axios.post<N8nWebhookResponse>(
    env.N8N_WEBHOOK_URL,
    payload,
    {
      timeout: env.N8N_WEBHOOK_TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
    }
  );

  logger.info("Mensagem encaminhada ao n8n", {
    remoteJid: payload.remoteJid,
    pushName: payload.pushName,
  });

  return data ?? null;
}
