import axios from "axios";
import { env } from "../config/env";
import { logger } from "../config/logger";
import type { InboundMessagePayload, N8nWebhookResponse } from "../types/messages";
import { forwardToErpBot } from "./erpBotService";
import { forwardInbound } from "./n8nService";

/** Erros em que vale acionar fallback ERP (evita esperar timeout longo do n8n). */
function isN8nRequestFailure(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return true;

  const code = err.code;
  if (
    code === "ECONNABORTED" ||
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT"
  ) {
    return true;
  }

  const status = err.response?.status;
  if (status == null) return true;

  return status === 404 || status === 405 || status >= 500;
}

/**
 * Processa mensagem inbound: n8n (opcional) com fallback para ERP.
 * O webhook de *teste* do n8n costuma responder 404 após a 1ª execução —
 * o fallback garante que opções como "1" continuem funcionando em dev.
 */
export async function processInboundMessage(
  payload: InboundMessagePayload
): Promise<N8nWebhookResponse | null> {
  if (env.BOT_CHAT_MODE === "erp") {
    return forwardToErpBot(payload);
  }

  try {
    const n8nResponse = await forwardInbound(payload);

    if (n8nResponse?.text) {
      return n8nResponse;
    }

    if (env.BOT_ERP_FALLBACK_ON_N8N_ERROR) {
      logger.warn("n8n respondeu sem text — usando ERP", {
        remoteJid: payload.remoteJid,
      });
      return forwardToErpBot(payload);
    }

    return n8nResponse;
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;

    if (env.BOT_ERP_FALLBACK_ON_N8N_ERROR && isN8nRequestFailure(err)) {
      logger.warn("n8n falhou — fallback para ERP /api/bot/chat", {
        remoteJid: payload.remoteJid,
        status,
        error: err instanceof Error ? err.message : String(err),
      });
      return forwardToErpBot(payload);
    }

    throw err;
  }
}
