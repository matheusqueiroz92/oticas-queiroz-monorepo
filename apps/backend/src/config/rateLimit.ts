import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Formato padronizado de resposta de erro (compatível com AppError)
 */
const rateLimitResponse = (_req: Request, res: Response) => {
  res.status(429).json({
    status: "error",
    code: "RATE_LIMIT_EXCEEDED",
    message: "Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.",
  });
};

/**
 * Rate limiter para login - proteção contra brute force
 * 10 requisições por 15 minutos por IP
 */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skip: () => process.env.NODE_ENV === "test",
});

/**
 * Rate limiter para forgot-password - proteção contra enumeração de emails
 * 5 requisições por 15 minutos por IP
 */
export const authForgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: "Muitas solicitações de redefinição. Tente novamente em 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skip: () => process.env.NODE_ENV === "test",
});

/**
 * Rate limiter para reset-password e validate-reset-token
 * 5 requisições por 15 minutos por IP
 */
export const authResetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: "Muitas tentativas. Tente novamente em 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skip: () => process.env.NODE_ENV === "test",
});

/**
 * Rate limiter global - proteção contra abuso da API
 * 100 requisições por 15 minutos por IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skip: (req) =>
    process.env.NODE_ENV === "test" || req.path === "/health",
});

/**
 * Rate limiter para refresh token - evita abuso de renovação
 * 20 requisições por 15 minutos por IP
 */
export const authRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skip: () => process.env.NODE_ENV === "test",
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
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skip: () => process.env.NODE_ENV === "test",
  keyGenerator: (req: Request): string => {
    // Usa remoteJid do body para /chat; para demais rotas usa IP como fallback
    const remoteJid = req.body?.remoteJid ?? req.body?.cpf;
    if (typeof remoteJid === "string" && remoteJid.length > 0) {
      return remoteJid;
    }
    return req.ip ?? "unknown";
  },
});
