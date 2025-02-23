import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";
import { verifyToken } from "../utils/jwt";
import { AuthError } from "../services/AuthService";

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
      throw new AuthError("Token não fornecido", 401);
    }

    const decoded = verifyToken(token) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      next(error);
    } else {
      next(new AuthError("Token inválido", 401));
    }
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthError("Token não fornecido", 401);
      }

      // Se for rota de profile, permite qualquer usuário autenticado
      if (req.path.includes("/profile")) {
        next();
        return;
      }

      // Para outras rotas, verifica as roles permitidas
      if (!roles.includes(req.user.role)) {
        throw new AuthError("Acesso não autorizado", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
