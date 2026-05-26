import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import type { Request, Response } from "express";
import { logger } from "./logger";

/**
 * Rate limit só em produção. Em dev/test (incl. Docker Desktop + npm run dev no host)
 * o limitador fica desligado para evitar bloqueios por hot reload e banco local vazio.
 * RATE_LIMIT_DISABLED=true no .env força desligado em qualquer ambiente.
 */
export const shouldSkipRateLimit = (): boolean => {
  if (process.env.RATE_LIMIT_DISABLED === "true") return true;
  return process.env.NODE_ENV !== "production";
};

/**
 * Lê um número inteiro positivo do process.env, com fallback seguro.
 */
const intEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Formato padronizado de resposta de erro (compatível com AppError)
 */
const rateLimitResponse = (req: Request, res: Response) => {
  logger.warn("Rate limit excedido", {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.status(429).json({
    status: "error",
    code: "RATE_LIMIT_EXCEEDED",
    message:
      "Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.",
  });
};

/**
 * Defaults compartilhados por todos os limiters.
 * Mantemos standardHeaders=true para expor RateLimit-* headers (RFC).
 */
const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skip: shouldSkipRateLimit,
};

/**
 * Rate limiter para login — proteção contra brute force.
 *
 * Chave: IP + login (normalizado). Isso evita que várias pessoas atrás do
 * mesmo NAT (escritório/loja) consumam a mesma quota apenas por compartilharem
 * o IP público. Cada par (IP, login) tem sua própria contagem.
 *
 * Padrão: 20 tentativas por 15 minutos por (IP + login).
 */
export const authLoginLimiter = rateLimit({
  ...baseOptions,
  windowMs: intEnv("RATE_LIMIT_LOGIN_WINDOW_MS", 15 * 60 * 1000),
  max: intEnv("RATE_LIMIT_LOGIN_MAX", 20),
  keyGenerator: (req: Request): string => {
    const rawLogin = req.body?.login;
    const login =
      typeof rawLogin === "string" ? rawLogin.trim().toLowerCase() : "";
    const ip = ipKeyGenerator(req.ip ?? "unknown");
    return login ? `${ip}::${login}` : ip;
  },
});

/**
 * Rate limiter para forgot-password — proteção contra enumeração de e-mails.
 * Padrão: 10 requisições por 15 minutos por IP.
 */
export const authForgotPasswordLimiter = rateLimit({
  ...baseOptions,
  windowMs: intEnv("RATE_LIMIT_FORGOT_WINDOW_MS", 15 * 60 * 1000),
  max: intEnv("RATE_LIMIT_FORGOT_MAX", 10),
});

/**
 * Rate limiter para reset-password e validate-reset-token.
 * Padrão: 10 requisições por 15 minutos por IP.
 */
export const authResetPasswordLimiter = rateLimit({
  ...baseOptions,
  windowMs: intEnv("RATE_LIMIT_RESET_WINDOW_MS", 15 * 60 * 1000),
  max: intEnv("RATE_LIMIT_RESET_MAX", 10),
});

/**
 * Rate limiter global — proteção contra abuso da API.
 *
 * IMPORTANTE: este limiter é aplicado a /api inteira e a quota é POR IP.
 * Quando vários usuários acessam de uma mesma rede (NAT da loja, escritório),
 * todos compartilham o mesmo IP público e, portanto, a mesma quota.
 *
 * O valor anterior (100 / 15min) era irrealista: uma única navegação no
 * dashboard dispara dezenas de requisições; bastava 2-3 funcionários ativos
 * para esgotar a quota e travar todo mundo, inclusive na tela de login.
 *
 * Padrão: 1000 requisições por minuto por IP (~16 req/s), configurável.
 * Para desabilitar completamente em casos extremos: RATE_LIMIT_DISABLED=true.
 */
export const globalLimiter = rateLimit({
  ...baseOptions,
  windowMs: intEnv("RATE_LIMIT_GLOBAL_WINDOW_MS", 60 * 1000),
  max: intEnv("RATE_LIMIT_GLOBAL_MAX", 1000),
  skip: (req) => shouldSkipRateLimit() || req.path === "/health",
});

/**
 * Rate limiter para refresh token — evita abuso de renovação.
 * Padrão: 60 requisições por 15 minutos por IP (mais alto porque o frontend
 * pode disparar refresh em paralelo a partir de várias abas/usuários no NAT).
 */
export const authRefreshLimiter = rateLimit({
  ...baseOptions,
  windowMs: intEnv("RATE_LIMIT_REFRESH_WINDOW_MS", 15 * 60 * 1000),
  max: intEnv("RATE_LIMIT_REFRESH_MAX", 60),
});

/**
 * Rate limiter dedicado para /api/bot/* (M2)
 *
 * O globalLimiter usa IP como chave, mas todo o tráfego do bot vem do mesmo
 * IP interno da rede Docker — o que tornaria o limite global ineficaz.
 * Aqui usamos o remoteJid (JID do usuário no WhatsApp) como chave, isolando
 * a quota por usuário real em vez de por IP.
 *
 * Limite: 30 mensagens por 1 minuto por remoteJid.
 * Um usuário legítimo raramente envia mais de 2-3 mensagens por minuto.
 */
export const botChatLimiter = rateLimit({
  ...baseOptions,
  windowMs: intEnv("RATE_LIMIT_BOT_WINDOW_MS", 60 * 1000),
  max: intEnv("RATE_LIMIT_BOT_MAX", 30),
  keyGenerator: (req: Request): string => {
    // Usa remoteJid do body para /chat; para demais rotas usa IP como fallback
    const remoteJid = req.body?.remoteJid ?? req.body?.cpf;
    if (typeof remoteJid === "string" && remoteJid.length > 0) {
      return remoteJid;
    }
    return ipKeyGenerator(req.ip ?? "unknown");
  },
});
