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
      throw new AuthError("Token não fornecido");
    }

    const decoded = verifyToken(token) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthError("Token não fornecido", 401);
      }

      if (!roles.includes(req.user.role)) {
        // Garantir que o erro é do tipo AuthError
        const error = new AuthError("Acesso não autorizado", 403);
        throw error;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
