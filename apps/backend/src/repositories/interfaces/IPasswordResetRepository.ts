import type { IBaseRepository } from "./IBaseRepository";

// Interface para PasswordReset
export interface IPasswordReset {
  _id?: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPasswordResetRepository extends IBaseRepository<IPasswordReset> {
  // Busca por token
  findByToken(token: string): Promise<IPasswordReset | null>;
  
  // Busca por userId
  findByUserId(userId: string): Promise<IPasswordReset[]>;
  
  // Remove tokens expirados
  removeExpiredTokens(): Promise<number>;
  
  // Remove todos os tokens de um usuário
  removeAllUserTokens(userId: string): Promise<number>;
  
  // Verifica se token existe e é válido (não expirado)
  isTokenValid(token: string): Promise<boolean>;
  
  // Busca tokens que expiram em breve (para limpeza)
  findExpiringTokens(beforeDate?: Date): Promise<IPasswordReset[]>;
  
  // Conta tokens ativos por usuário
  countActiveTokensByUser(userId: string): Promise<number>;
  
  // Remove tokens expirados de um usuário específico
  removeExpiredUserTokens(userId: string): Promise<number>;
} 