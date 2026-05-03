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
