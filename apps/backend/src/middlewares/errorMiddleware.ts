import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";
import { ZodError } from "zod";
import type { MongoServerError } from "mongodb";
import { MulterError } from "multer";

interface ErrorResponse {
  status: string;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export const errorMiddleware = (
  error: Error | AppError | MulterError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[Error] ${error.name}: ${error.message}`);

  if (error instanceof AppError) {
    const responseObj: ErrorResponse = {
      status: "error",
      code: error.code,
      message: error.message,
    };

    if (error.details) {
      responseObj.details = error.details;
    }

    res.status(error.statusCode).json(responseObj);
    return;
  }

  if (error instanceof ZodError) {
    const responseObj: ErrorResponse = {
      status: "error",
      code: ErrorCode.VALIDATION_ERROR,
      message: "Dados inválidos",
      details: error.errors,
    };
    res.status(400).json(responseObj);
    return;
  }

  if (error instanceof MulterError) {
    const responseObj: ErrorResponse = {
      status: "error",
      code:
        error.code === "LIMIT_FILE_SIZE"
          ? ErrorCode.FILE_TOO_LARGE
          : ErrorCode.VALIDATION_ERROR,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Arquivo muito grande. Tamanho máximo: 5MB"
          : error.message,
    };
    res.status(400).json(responseObj);
    return;
  }

  if (error.message?.includes("Tipo de arquivo não suportado")) {
    const responseObj: ErrorResponse = {
      status: "error",
      code: ErrorCode.INVALID_FILE_TYPE,
      message: "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.",
    };
    res.status(400).json(responseObj);
    return;
  }

  if (
    error.name === "MongoServerError" &&
    (error as MongoServerError).code === 11000
  ) {
    const keyPattern = (error as MongoServerError).keyPattern;
    let code = ErrorCode.VALIDATION_ERROR;
    let message = "Dados duplicados encontrados";

    if (keyPattern?.email) {
      code = ErrorCode.DUPLICATE_EMAIL;
      message = "Email já cadastrado";
    } else if (keyPattern?.cpf) {
      code = ErrorCode.DUPLICATE_CPF;
      message = "CPF já cadastrado";
    }

    const responseObj: ErrorResponse = {
      status: "error",
      code,
      message,
    };
    res.status(400).json(responseObj);
    return;
  }

  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    const responseObj: ErrorResponse = {
      status: "error",
      code: ErrorCode.UNAUTHORIZED,
      message: "Token inválido ou expirado",
    };
    res.status(401).json(responseObj);
    return;
  }

  const responseObj: ErrorResponse = {
    status: "error",
    code: ErrorCode.INTERNAL_ERROR,
    message: "Erro interno do servidor",
  };
  res.status(500).json(responseObj);
};
