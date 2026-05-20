/**
 * Variáveis de ambiente específicas do chatbot (M5)
 *
 * Centraliza e valida via Zod as env vars do bot que antes eram lidas
 * diretamente com process.env em botChatMessages.ts, quebrando o padrão
 * do projeto de configuração centralizada com validação de tipos.
 */
import { z } from "zod";

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

  /** TTL de inatividade da sessão do bot em minutos. */
  BOT_SESSION_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(30),
});

const parsed = botEnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Erros de configuração do bot são não-fatais: usamos defaults seguros
  // e logamos para que o problema seja visível sem derrubar o servidor.
  console.warn(
    "[botEnv] Aviso: variáveis de ambiente do bot com valores inválidos — usando defaults:\n" +
      parsed.error.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n")
  );
}

const data = parsed.success ? parsed.data : botEnvSchema.parse({});

export const botEnv = {
  examPriceBrl: data.BOT_EXAM_PRICE_BRL,
  sessionTtlMinutes: data.BOT_SESSION_TTL_MINUTES,
} as const;
