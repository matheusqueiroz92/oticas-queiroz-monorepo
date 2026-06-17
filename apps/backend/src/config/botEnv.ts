/**
 * Variáveis de ambiente específicas do chatbot (M5)
 *
 * Centraliza e valida via Zod as env vars do bot que antes eram lidas
 * diretamente com process.env em botChatMessages.ts, quebrando o padrão
 * do projeto de configuração centralizada com validação de tipos.
 */
import { z } from "zod";

const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (typeof val === "boolean") return val;
    const normalized = val.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
    return undefined;
  });

const botEnvSchema = z.object({
  /** Valor da consulta de exame de vista em R$ (ex.: "150" ou "150,00"). */
  BOT_EXAM_PRICE_BRL: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 150;
      const parsed = Number.parseFloat(val.replace(",", "."));
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 150;
    }),

  /** TTL de inatividade da sessão do bot em minutos (fallback passivo). */
  BOT_SESSION_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(30),

  /** Minutos sem resposta antes de enviar aviso proativo. */
  BOT_INACTIVITY_WARNING_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10),

  /** Minutos após o aviso para encerrar a conversa. */
  BOT_INACTIVITY_CLOSE_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5),

  /** Intervalo do job de monitoramento de inatividade (segundos). */
  BOT_INACTIVITY_POLL_INTERVAL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60),

  /** Habilita o monitor proativo de inatividade. */
  BOT_INACTIVITY_MONITOR_ENABLED: booleanFromEnv,

  /** URL base do gateway WhatsApp (send-message). */
  WHATSAPP_BOT_URL: z
    .string()
    .optional()
    .transform((val) => val?.trim() || "http://localhost:3344"),
});

const parsed = botEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn(
    "[botEnv] Aviso: variáveis de ambiente do bot com valores inválidos — usando defaults:\n" +
      parsed.error.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n")
  );
}

const data = parsed.success ? parsed.data : botEnvSchema.parse({});

const nodeEnv = process.env.NODE_ENV ?? "development";
const monitorEnabledDefault = nodeEnv !== "test";

export const botEnv = {
  examPriceBrl: data.BOT_EXAM_PRICE_BRL,
  sessionTtlMinutes: data.BOT_SESSION_TTL_MINUTES,
  inactivityWarningMinutes: data.BOT_INACTIVITY_WARNING_MINUTES,
  inactivityCloseMinutes: data.BOT_INACTIVITY_CLOSE_MINUTES,
  inactivityPollIntervalSeconds: data.BOT_INACTIVITY_POLL_INTERVAL_SECONDS,
  inactivityMonitorEnabled:
    data.BOT_INACTIVITY_MONITOR_ENABLED ?? monitorEnabledDefault,
  whatsappBotUrl: data.WHATSAPP_BOT_URL,
} as const;
