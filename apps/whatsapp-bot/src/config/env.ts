import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const isTest = process.env.NODE_ENV === "test";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().min(1).max(65535).default(3344),
  BOT_API_KEY: isTest
    ? z.string().default("test-bot-api-key")
    : z.string().min(1, "BOT_API_KEY é obrigatória"),
  N8N_WEBHOOK_URL: isTest
    ? z.string().url().default("http://localhost:5678/webhook/test")
    : z.string().url("N8N_WEBHOOK_URL deve ser uma URL válida"),
  N8N_WEBHOOK_TIMEOUT_MS: z.coerce.number().positive().default(10000),
  /** URL base do backend ERP (ex.: http://localhost:3333) */
  ERP_API_URL: z.string().url().default("http://localhost:3333"),
  /**
   * n8n = só webhook n8n (com fallback se BOT_ERP_FALLBACK_ON_N8N_ERROR=true)
   * erp = chama direto POST /api/bot/chat (recomendado em dev sem n8n produção)
   */
  BOT_CHAT_MODE: z.enum(["n8n", "erp"]).default("n8n"),
  /** Se n8n retornar 404/5xx ou body sem text, chama o ERP */
  BOT_ERP_FALLBACK_ON_N8N_ERROR: z.coerce.boolean().default(true),
  WA_SESSION_PATH: z.string().default("./data/auth"),
  WA_RECONNECT_DELAY_MS: z.coerce.number().positive().default(3000),
  LOG_LEVEL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    console.error("Erro na validação das variáveis de ambiente:\n" + errors);
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
