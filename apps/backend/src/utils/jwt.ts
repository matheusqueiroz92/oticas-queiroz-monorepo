import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET as string;
  if (!secret) {
    throw new Error("JWT_SECRET não está definido no ambiente");
  }
  return secret;
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

// Gera o access token JWT
export const generateToken = (userId: string, role: string) => {
  const secret = getJwtSecret();
  return jwt.sign(
    { id: userId, role },
    secret,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
};

// Verifica se o access token é válido
export const verifyToken = (token: string) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

// Gera refresh token (opaque, armazenado no BD)
export const generateRefreshTokenValue = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

export const getRefreshTokenExpiry = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return date;
};

export { REFRESH_TOKEN_EXPIRES_DAYS };
