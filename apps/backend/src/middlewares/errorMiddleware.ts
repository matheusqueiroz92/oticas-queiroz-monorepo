import type { Request, Response, NextFunction } from "express";
import { AuthError } from "../services/AuthService";
import { UserError } from "../services/UserService";
import type { IError } from "../interfaces/IError";

export const errorMiddleware = (
  error: IError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[Error] ${error.name}: ${error.message}`);

  if (error instanceof AuthError || error instanceof UserError) {
    res.status(error.statusCode || 400).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  // MongoDB duplicate key error
  if (error.code === "11000") {
    res.status(400).json({
      status: "error",
      message: "Dados duplicados encontrados",
    });
    return;
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    res.status(401).json({
      status: "error",
      message: "Token inválido",
    });
    return;
  }

  if (error.name === "TokenExpiredError") {
    res.status(401).json({
      status: "error",
      message: "Token expirado",
    });
    return;
  }

  // Default error
  res.status(500).json({
    status: "error",
    message: "Erro interno do servidor",
  });
};
