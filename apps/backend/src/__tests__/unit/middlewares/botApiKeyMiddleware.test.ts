import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { botApiKeyMiddleware } from "../../../middlewares/botApiKeyMiddleware";
import { AuthError } from "../../../utils/AppError";

describe("botApiKeyMiddleware", () => {
  const original = process.env.BOT_API_KEY;

  afterEach(() => {
    process.env.BOT_API_KEY = original;
  });

  beforeEach(() => {
    process.env.BOT_API_KEY = "secret-key-for-bot-integration";
  });

  it("calls next when x-api-key matches", () => {
    const next = jest.fn() as NextFunction;
    const req = {
      header: (n: string) => (n === "x-api-key" ? "secret-key-for-bot-integration" : ""),
    } as unknown as Request;
    botApiKeyMiddleware(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next with AuthError when key missing in env", () => {
    delete process.env.BOT_API_KEY;
    const next = jest.fn() as NextFunction;
    const req = { header: () => "secret-key-for-bot-integration" } as unknown as Request;
    botApiKeyMiddleware(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthError));
  });

  it("calls next with AuthError when header wrong", () => {
    const next = jest.fn() as NextFunction;
    const req = {
      header: (n: string) => (n === "x-api-key" ? "wrong" : ""),
    } as unknown as Request;
    botApiKeyMiddleware(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthError));
  });

  it("calls next with AuthError when x-api-key header missing", () => {
    const next = jest.fn() as NextFunction;
    const req = {
      header: () => undefined,
    } as unknown as Request;
    botApiKeyMiddleware(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthError));
  });
});
