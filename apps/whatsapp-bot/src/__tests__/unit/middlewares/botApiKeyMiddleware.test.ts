import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { botApiKeyMiddleware } from "../../../middlewares/botApiKeyMiddleware";

describe("botApiKeyMiddleware", () => {
  const original = process.env.BOT_API_KEY;

  afterEach(() => {
    process.env.BOT_API_KEY = original;
  });

  beforeEach(() => {
    process.env.BOT_API_KEY = "secret-key-for-bot-integration";
  });

  function mockRes() {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    return res;
  }

  it("calls next when x-api-key matches", () => {
    const next = jest.fn() as NextFunction;
    const req = {
      header: (n: string) =>
        n === "x-api-key" ? "secret-key-for-bot-integration" : "",
    } as unknown as Request;
    botApiKeyMiddleware(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when key missing in env", () => {
    delete process.env.BOT_API_KEY;
    const next = jest.fn() as NextFunction;
    const res = mockRes();
    const req = {
      header: () => "secret-key-for-bot-integration",
    } as unknown as Request;
    botApiKeyMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when header wrong", () => {
    const next = jest.fn() as NextFunction;
    const res = mockRes();
    const req = {
      header: (n: string) => (n === "x-api-key" ? "wrong" : ""),
    } as unknown as Request;
    botApiKeyMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when x-api-key header missing", () => {
    const next = jest.fn() as NextFunction;
    const res = mockRes();
    const req = {
      header: () => undefined,
    } as unknown as Request;
    botApiKeyMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
