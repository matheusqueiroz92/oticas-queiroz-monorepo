import { z } from "zod";
import {
  normalizeInboundText,
  normalizeRemoteJid,
} from "../../utils/botInboundNormalize";
import type {
  BotCustomerDebtsResponse,
  BotOrderSummaryResponse,
} from "./BotApiDtos";

function unwrapWebhookBody(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (record.body && typeof record.body === "object") {
    return record.body;
  }
  return value;
}

export const botWebhookBodySchema = z.preprocess(
  unwrapWebhookBody,
  z.object({
    remoteJid: z.preprocess(
      (value) => normalizeRemoteJid(value),
      z.string().min(1, "remoteJid é obrigatório")
    ),
    text: z.preprocess(
      (value) => normalizeInboundText(value),
      z.string()
    ),
  })
);

export type BotWebhookBody = z.infer<typeof botWebhookBodySchema>;

export const BOT_WEBHOOK_ACTIONS = [
  "SHOW_MENU",
  "ASK_OS",
  "ASK_CPF",
  "ASK_AGENDAMENTO",
  "ASK_ORCAMENTO",
  "AGENDAMENTO_CONFIRMED",
  "ORCAMENTO_CONFIRMED",
  "SEND_MESSAGE",
  "SESSION_EXPIRED",
  "ORDER_RESULT",
  "DEBTS_RESULT",
] as const;

export type BotWebhookAction = (typeof BOT_WEBHOOK_ACTIONS)[number];

export interface BotWebhookResponse {
  action: BotWebhookAction;
  text: string;
  data?: BotOrderSummaryResponse | BotCustomerDebtsResponse;
  sessionStatus: string | null;
}

export function createBotWebhookFallbackResponse(
  message = "Não foi possível processar sua mensagem. Tente novamente em instantes."
): BotWebhookResponse {
  return {
    action: "SEND_MESSAGE",
    text: message,
    sessionStatus: null,
  };
}
