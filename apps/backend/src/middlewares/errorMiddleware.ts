import type { Request, Response, NextFunction } from "express";
import { AuthError } from "../services/AuthService";
import { UserError } from "../services/UserService";
import type { MongoServerError } from "mongodb";

interface CustomError extends Error {
  code?: number;
  statusCode?: number;
}

export const errorMiddleware = (
  error: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[Error] ${error.name}: ${error.message}`);

  if (error instanceof AuthError) {
    res.status(401).json({
      status: "error",
      message: error.message,
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

  res.status(500).json({
    status: "error",
    message: "Erro interno do servidor",
  });
};
