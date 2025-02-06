import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Garante que a chave secreta existe
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET as string;
  if (!secret) {
    throw new Error("JWT_SECRET não está definido no ambiente");
  }
  return secret;
};

// Gera o JWT com as informações do usuário
export const generateToken = (userId: string, role: string) => {
  const secret = getJwtSecret();
  return jwt.sign({ id: userId, role }, secret, { expiresIn: "24h" });
};

// Verifica se o token é válido
export const verifyToken = (token: string) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};
