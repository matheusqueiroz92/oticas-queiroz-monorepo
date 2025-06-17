import { BaseRepository } from "./BaseRepository";
import type { IPasswordResetRepository, IPasswordReset } from "../interfaces/IPasswordResetRepository";
import { PasswordReset } from "../../models/PasswordResetModel";

export class MongoPasswordResetRepository 
  extends BaseRepository<IPasswordReset> 
  implements IPasswordResetRepository 
{
  constructor() {
    super(PasswordReset);
  }

  protected convertToInterface(doc: any): IPasswordReset {
    return {
      _id: doc._id?.toString(),
      userId: doc.userId?.toString(),
      token: doc.token,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  /**
   * Busca por token
   */
  async findByToken(token: string): Promise<IPasswordReset | null> {
    try {
      const resetRequest = await PasswordReset.findOne({ token });
      return resetRequest ? this.convertToInterface(resetRequest) : null;
    } catch (error) {
      console.error("Erro ao buscar por token:", error);
      throw error;
    }
  }

  /**
   * Busca por userId
   */
  async findByUserId(userId: string): Promise<IPasswordReset[]> {
    try {
      const resetRequests = await PasswordReset.find({ userId });
      return resetRequests.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error("Erro ao buscar por userId:", error);
      throw error;
    }
  }

  /**
   * Remove tokens expirados
   */
  async removeExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      const result = await PasswordReset.deleteMany({ 
        expiresAt: { $lt: now } 
      });
      
      console.log(`Removidos ${result.deletedCount} tokens expirados`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error("Erro ao remover tokens expirados:", error);
      return 0;
    }
  }

  /**
   * Remove todos os tokens de um usuário
   */
  async removeAllUserTokens(userId: string): Promise<number> {
    try {
      const result = await PasswordReset.deleteMany({ userId });
      
      console.log(`Removidos ${result.deletedCount} tokens do usuário ${userId}`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error("Erro ao remover tokens do usuário:", error);
      return 0;
    }
  }

  /**
   * Verifica se token existe e é válido (não expirado)
   */
  async isTokenValid(token: string): Promise<boolean> {
    try {
      const now = new Date();
      const resetRequest = await PasswordReset.findOne({ 
        token,
        expiresAt: { $gt: now }
      });
      
      return !!resetRequest;
    } catch (error) {
      console.error("Erro ao verificar validade do token:", error);
      return false;
    }
  }

  /**
   * Busca tokens que expiram em breve (para limpeza)
   */
  async findExpiringTokens(beforeDate?: Date): Promise<IPasswordReset[]> {
    try {
      const cutoffDate = beforeDate || new Date(Date.now() + (60 * 60 * 1000)); // 1 hora
      
      const expiringTokens = await PasswordReset.find({ 
        expiresAt: { $lt: cutoffDate } 
      });
      
      return expiringTokens.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error("Erro ao buscar tokens expirando:", error);
      throw error;
    }
  }

  /**
   * Conta tokens ativos por usuário
   */
  async countActiveTokensByUser(userId: string): Promise<number> {
    try {
      const now = new Date();
      const count = await PasswordReset.countDocuments({ 
        userId,
        expiresAt: { $gt: now }
      });
      
      return count;
    } catch (error) {
      console.error("Erro ao contar tokens ativos do usuário:", error);
      return 0;
    }
  }

  /**
   * Remove tokens expirados de um usuário específico
   */
  async removeExpiredUserTokens(userId: string): Promise<number> {
    try {
      const now = new Date();
      const result = await PasswordReset.deleteMany({ 
        userId,
        expiresAt: { $lt: now } 
      });
      
      console.log(`Removidos ${result.deletedCount} tokens expirados do usuário ${userId}`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error("Erro ao remover tokens expirados do usuário:", error);
      return 0;
    }
  }
} 