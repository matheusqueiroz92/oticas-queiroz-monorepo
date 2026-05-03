import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
    .pipe(z.number().min(1).max(65535))
    .default(3333),
  MONGODB_URI: isTest
    ? z.string().optional()
    : z.string().min(1, "MONGODB_URI é obrigatória"),
  JWT_SECRET: isTest
    ? z.string().default("test-jwt-secret")
    : z.string().min(16, "JWT_SECRET deve ter pelo menos 16 caracteres"),
  FRONTEND_URL: z.string().optional(),
  API_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    console.error("❌ Erro na validação das variáveis de ambiente:\n" + errors);
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
