import { ErrorCode } from "./errorCodes";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;

    // Para o stacktrace funcionar corretamente
    Error.captureStackTrace(this, this.constructor);
  }
}

// Erro específico de autenticação
export class AuthError extends AppError {
  constructor(
    message = "Erro de autenticação",
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
    details?: unknown
  ) {
    super(message, 401, code, details);
  }
}

// Erro de validação
export class ValidationError extends AppError {
  constructor(
    message = "Erro de validação",
    code: ErrorCode = ErrorCode.VALIDATION_ERROR,
    details?: unknown
  ) {
    super(message, 400, code, details);
  }
}

// Erro de recurso não encontrado
export class NotFoundError extends AppError {
  constructor(
    message = "Recurso não encontrado",
    code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
    details?: unknown
  ) {
    super(message, 404, code, details);
  }
}

// Erro de permissão
export class PermissionError extends AppError {
  constructor(
    message = "Permissão negada",
    code: ErrorCode = ErrorCode.INSUFFICIENT_PERMISSIONS,
    details?: unknown
  ) {
    super(message, 403, code, details);
  }
}
