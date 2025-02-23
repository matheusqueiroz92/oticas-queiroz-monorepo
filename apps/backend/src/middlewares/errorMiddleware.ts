import type { Request, Response, NextFunction } from "express";
import { AuthError } from "../services/AuthService";
import { UserError } from "../services/UserService";
import type { MongoServerError } from "mongodb";
import { MulterError } from "multer";

interface CustomError extends Error {
  code?: string | number;
  statusCode?: number;
}

export const errorMiddleware = (
  error: Error | CustomError | MulterError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[Error] ${error.name}: ${error.message}`);

  // Multer errors
  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        status: "error",
        message: "Arquivo muito grande. Tamanho máximo: 5MB",
      });
      return;
    }
    res.status(400).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  // File type error
  if (error.message?.includes("Tipo de arquivo não suportado")) {
    res.status(400).json({
      status: "error",
      message: "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.",
    });
    return;
  }

  if (error instanceof AuthError) {
    const status = error.statusCode || 401;
    res.status(status).json({
      status: "error",
      message: error.message,
      code: status,
    });
    return;
  }

  if (error instanceof UserError) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  // MongoDB errors
  if (
    error.name === "MongoServerError" &&
    (error as MongoServerError).code === 11000
  ) {
    res.status(400).json({
      status: "error",
      message: "Dados duplicados encontrados",
    });
    return;
  }

  // JWT errors
  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    res.status(401).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  // Default error handler
  res.status(500).json({
    status: "error",
    message: "Erro interno do servidor",
  });
};
