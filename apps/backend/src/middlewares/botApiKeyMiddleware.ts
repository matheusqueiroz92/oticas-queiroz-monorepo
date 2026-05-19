import type { Request, Response, NextFunction } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { AuthError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

function hashKey(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Autenticação simples para integrações externas (ex.: n8n): header `x-api-key` == `BOT_API_KEY`.
 */
export function botApiKeyMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const configured = process.env.BOT_API_KEY?.trim();
    if (!configured) {
      throw new AuthError(
        "Chave de API do bot não configurada no servidor.",
        ErrorCode.UNAUTHORIZED
      );
    }

    const headerVal = req.header("x-api-key");
    const provided = typeof headerVal === "string" ? headerVal.trim() : "";

    const a = hashKey(provided);
    const b = hashKey(configured);
    if (!timingSafeEqual(a, b)) {
      throw new AuthError("Chave de API inválida.", ErrorCode.UNAUTHORIZED);
    }

    next();
  } catch (e) {
    next(e);
  }
}
