import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";
import { verifyToken } from "../utils/jwt";
import { AuthError, PermissionError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new AuthError("Token não fornecido", ErrorCode.UNAUTHORIZED);
    }

    const decoded = verifyToken(token) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: unknown) {
    // Tipagem explícita para o erro
    if (typeof error === "object" && error !== null) {
      // Verificar o tipo de erro JWT
      if ("name" in error) {
        if (error.name === "JsonWebTokenError") {
          next(new AuthError("Token inválido", ErrorCode.INVALID_TOKEN));
          return;
        }

        if (error.name === "TokenExpiredError") {
          next(new AuthError("Token expirado", ErrorCode.INVALID_TOKEN));
          return;
        }
      }
    }

    // Se for um AuthError, passa adiante
    if (error instanceof AuthError) {
      next(error);
      return;
    }

    // Erro genérico
    next(new AuthError("Erro de autenticação", ErrorCode.UNAUTHORIZED));
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthError("Token não fornecido", ErrorCode.UNAUTHORIZED);
      }

      // Se for rota de profile, permite qualquer usuário autenticado
      if (req.path.includes("/profile")) {
        next();
        return;
      }

      // Para outras rotas, verifica as roles permitidas
      if (!roles.includes(req.user.role)) {
        throw new PermissionError(
          "Acesso não autorizado",
          ErrorCode.INSUFFICIENT_PERMISSIONS
        );
      }

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
};
