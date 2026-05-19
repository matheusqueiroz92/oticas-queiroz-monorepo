import type { Request, Response, NextFunction } from "express";
import { createHash, timingSafeEqual } from "node:crypto";

function hashKey(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export class UnauthorizedError extends Error {
  readonly statusCode = 401;

  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Autenticação para integrações externas (n8n): header `x-api-key` == `BOT_API_KEY`.
 */
export function botApiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const configured = process.env.BOT_API_KEY?.trim();
    if (!configured) {
      res.status(401).json({
        status: "error",
        message: "Chave de API do bot não configurada no servidor.",
      });
      return;
    }

    const headerVal = req.header("x-api-key");
    const provided = typeof headerVal === "string" ? headerVal.trim() : "";

    const a = hashKey(provided);
    const b = hashKey(configured);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      res.status(401).json({
        status: "error",
        message: "Chave de API inválida.",
      });
      return;
    }

    next();
  } catch {
    res.status(401).json({
      status: "error",
      message: "Chave de API inválida.",
    });
  }
}
