import { UserService } from "./UserService";
import { EmailService } from "./EmailService";
import { RepositoryFactory } from "../repositories/RepositoryFactory";
import type { IPasswordResetRepository } from "../repositories/interfaces/IPasswordResetRepository";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { ValidationError, NotFoundError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

export class PasswordResetService {
  private userService: UserService;
  private emailService: EmailService;
  private passwordResetRepository: IPasswordResetRepository;
  private userRepository: IUserRepository;

  constructor() {
    this.userService = new UserService();
    this.emailService = new EmailService();
    const factory = RepositoryFactory.getInstance();
    this.passwordResetRepository = factory.getPasswordResetRepository();
    this.userRepository = factory.getUserRepository();
  }

  /**
   * Cria um token de redefinição para o email especificado
   * e envia um email com instruções.
   *
   * @param email Email do usuário que solicitou a redefinição
   * @returns Token gerado (apenas para propósitos de teste)
   */
  async createResetToken(email: string): Promise<string> {
    try {
      // Verificar se o usuário existe
      const user = await this.userService.getUserByEmail(email);

      // Remover qualquer token existente para este usuário
      await this.passwordResetRepository.removeAllUserTokens(user._id!);

      // Gerar um token único
      const token = randomBytes(32).toString("hex");

      // Calcular a data de expiração (1 hora a partir de agora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Criar o registro de redefinição
      await this.passwordResetRepository.create({
        userId: user._id!,
        token,
        expiresAt,
      });

      // Construir link de redefinição
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/auth/reset-password/${token}`;

      // Enviar email com o link de redefinição
      await this.emailService.sendPasswordResetEmail(email, resetLink);

      return token;
    } catch (error) {
      // Se o usuário não for encontrado, tratamos como erro mas não informamos ao cliente
      if (error instanceof NotFoundError) {
        // Registrar o evento por segurança
        console.warn(`Tentativa de reset de senha para email não encontrado: ${email}`);
        // Retornar um token falso para não revelar que o email não existe
        return randomBytes(32).toString("hex");
      }

      // Propagar outros erros
      throw error;
    }
  }

  /**
   * Valida se um token de redefinição é válido e não expirou
   *
   * @param token Token a ser validado
   * @returns Verdadeiro se o token for válido
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      const isValid = await this.passwordResetRepository.isTokenValid(token);
      
      if (!isValid) {
        // Token inválido ou expirado, limpar tokens expirados
        await this.passwordResetRepository.removeExpiredTokens();
      }
      
      return isValid;
    } catch (error) {
      console.error("Erro ao validar token:", error);
      return false;
    }
  }

  /**
   * Redefine a senha do usuário usando um token de redefinição
   *
   * @param token Token de redefinição
   * @param newPassword Nova senha
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Buscar o token de redefinição
    const resetRequest = await this.passwordResetRepository.findByToken(token);

    if (!resetRequest) {
      throw new ValidationError(
        "Token inválido ou expirado",
        ErrorCode.INVALID_TOKEN
      );
    }

    // Verificar se o token expirou
    if (resetRequest.expiresAt < new Date()) {
      // Remover token expirado
      await this.passwordResetRepository.delete(resetRequest._id!);
      throw new ValidationError("Token expirado", ErrorCode.INVALID_TOKEN);
    }

    // Verificar se a senha é válida
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError(
        "A senha deve ter pelo menos 6 caracteres",
        ErrorCode.INVALID_PASSWORD
      );
    }

    // Gerar hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Atualizar a senha do usuário usando o repository
    const updated = await this.userRepository.update(
      resetRequest.userId,
      { password: hashedPassword }
    );

    if (!updated) {
      throw new NotFoundError(
        "Usuário não encontrado",
        ErrorCode.USER_NOT_FOUND
      );
    }

    // Remover o token de redefinição (uso único)
    await this.passwordResetRepository.delete(resetRequest._id!);
    
    // Limpar outros tokens expirados do usuário
    await this.passwordResetRepository.removeExpiredUserTokens(resetRequest.userId);
  }

  // Novos métodos usando funcionalidades avançadas do repository

  /**
   * Obtém todos os tokens ativos de um usuário
   */
  async getUserActiveTokens(userId: string) {
    const tokens = await this.passwordResetRepository.findByUserId(userId);
    const now = new Date();
    
    return tokens.filter(token => token.expiresAt > now);
  }

  /**
   * Conta quantos tokens ativos um usuário possui
   */
  async countUserActiveTokens(userId: string): Promise<number> {
    return this.passwordResetRepository.countActiveTokensByUser(userId);
  }

  /**
   * Remove todos os tokens de um usuário (útil para logout forçado)
   */
  async removeAllUserTokens(userId: string): Promise<number> {
    return this.passwordResetRepository.removeAllUserTokens(userId);
  }

  /**
   * Limpeza automática de tokens expirados
   */
  async cleanupExpiredTokens(): Promise<number> {
    return this.passwordResetRepository.removeExpiredTokens();
  }

  /**
   * Busca tokens que expiram em breve
   */
  async getExpiringTokens(beforeDate?: Date) {
    return this.passwordResetRepository.findExpiringTokens(beforeDate);
  }

  /**
   * Verifica se existe token válido para um usuário
   */
  async hasValidTokenForUser(userId: string): Promise<boolean> {
    const count = await this.passwordResetRepository.countActiveTokensByUser(userId);
    return count > 0;
  }
}
