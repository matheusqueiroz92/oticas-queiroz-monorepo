import { EmailService } from "../../../services/EmailService";
import { getRepositories } from "../../../repositories/RepositoryFactory";
import type { IUserRepository } from "../../../repositories/interfaces/IUserRepository";
import type { IUser } from "../../../interfaces/IUser";
import nodemailer from "nodemailer";
import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";

// Mock do nodemailer
jest.mock("nodemailer");
// Mock do RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory");

describe("EmailService", () => {
  let emailService: EmailService;
  let mockTransporter: jest.Mocked<any>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar variáveis de ambiente originais
    originalEnv = process.env;

    // Configurar variáveis de ambiente para os testes
    process.env = {
      ...originalEnv,
      EMAIL_USER: "test@oticasqueiroz.com",
      EMAIL_PASSWORD: "testpassword",
      EMAIL_HOST: "smtp.gmail.com",
      EMAIL_PORT: "587",
      EMAIL_SECURE: "false",
    };

    // Setup do mock do transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    // Setup do mock do repository
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      findByCnpj: jest.fn(),
      findByServiceOrder: jest.fn(),
      emailExists: jest.fn(),
      cpfExists: jest.fn(),
      cnpjExists: jest.fn(),
      findByRole: jest.fn(),
      search: jest.fn(),
      updatePassword: jest.fn(),
      findDeleted: jest.fn(),
    };

    (getRepositories as jest.Mock).mockReturnValue({
      userRepository: mockUserRepository,
    });

    emailService = new EmailService();
  });

  afterEach(() => {
    // Restaurar variáveis de ambiente
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  const mockUser: IUser = {
    _id: "userId123",
    name: "João Silva",
    email: "joao@example.com",
    password: "hashedPassword",
    role: "customer",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    comparePassword: async () => true,
  };

  describe("constructor", () => {
    it("should create transporter with correct configuration", () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "test@oticasqueiroz.com",
          pass: "testpassword",
        },
        debug: true,
      });
    });

    it("should use default values when env vars are not set", () => {
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_PORT;
      delete process.env.EMAIL_SECURE;

      new EmailService();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
        })
      );
    });

    it("should log error when email credentials are not configured", () => {
      // Mock console.error para capturar as mensagens
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Remover credenciais de email
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASSWORD;

      // Criar o service para disparar as linhas 17-18
      new EmailService();

      // Verificar se os console.error foram chamados (linhas 17-18)
      expect(consoleSpy).toHaveBeenCalledWith("ERRO: Credenciais de email não configuradas!");
      expect(consoleSpy).toHaveBeenCalledWith("Defina EMAIL_USER e EMAIL_PASSWORD no arquivo .env");
      
      // Restaurar console.error
      consoleSpy.mockRestore();
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send password reset email with user name", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const resetLink = "/reset-password?token=abc123";
      await emailService.sendPasswordResetEmail(mockUser.email!, resetLink);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Óticas Queiroz" <test@oticasqueiroz.com>',
          to: mockUser.email,
          subject: "Recuperação de Senha",
          html: expect.stringContaining("João Silva"),
          text: expect.stringContaining("João Silva"),
        })
      );
    });

    it("should send password reset email with default name when user not found", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const resetLink = "/reset-password?token=abc123";
      await emailService.sendPasswordResetEmail("unknown@example.com", resetLink);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Usuário"),
          text: expect.stringContaining("Usuário"),
        })
      );
    });

    it("should handle full reset link URL", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      const fullResetLink = "https://app.oticasqueiroz.com.br/reset-password?token=abc123";
      await emailService.sendPasswordResetEmail(mockUser.email!, fullResetLink);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(fullResetLink),
          text: expect.stringContaining(fullResetLink),
        })
      );
    });

    it("should throw error if email sending fails", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      const error = new Error("SMTP Error");
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        emailService.sendPasswordResetEmail(mockUser.email!, "/reset-password?token=abc123")
      ).rejects.toThrow("SMTP Error");
    });
  });

  describe("sendWelcomeEmail", () => {
    it("should send welcome email with user name", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await emailService.sendWelcomeEmail(mockUser.email!);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Óticas Queiroz" <test@oticasqueiroz.com>',
          to: mockUser.email,
          subject: "Bem-vindo à Óticas Queiroz!",
          html: expect.stringContaining("João Silva"),
          text: expect.stringContaining("João Silva"),
        })
      );
    });

    it("should send welcome email with default name when user not found", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await emailService.sendWelcomeEmail("unknown@example.com");

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Usuário"),
          text: expect.stringContaining("Usuário"),
        })
      );
    });

    it("should throw error if email sending fails", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      const error = new Error("SMTP Error");
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(emailService.sendWelcomeEmail(mockUser.email!)).rejects.toThrow("SMTP Error");
    });
  });

  describe("sendOrderStatusEmail", () => {
    it("should send order status email with correct message for pending status", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await emailService.sendOrderStatusEmail(mockUser.email!, "ORD-12345", "pending");

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Atualização do Pedido #ORD-12345",
          html: expect.stringContaining("está sendo processado"),
          text: expect.stringContaining("está sendo processado"),
        })
      );
    });

    it("should send order status email with correct message for ready status", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await emailService.sendOrderStatusEmail(mockUser.email!, "ORD-12345", "ready");

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("pronto para retirada"),
          text: expect.stringContaining("pronto para retirada"),
        })
      );
    });

    it("should send order status email with default message for unknown status", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await emailService.sendOrderStatusEmail(mockUser.email!, "ORD-12345", "custom_status");

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("custom_status"),
          text: expect.stringContaining("custom_status"),
        })
      );
    });

    it("should use default client name when user not found", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await emailService.sendOrderStatusEmail("unknown@example.com", "ORD-12345", "delivered");

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Cliente"),
          text: expect.stringContaining("Cliente"),
        })
      );
    });

    it("should throw error if email sending fails", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      const error = new Error("SMTP Error");
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        emailService.sendOrderStatusEmail(mockUser.email!, "ORD-12345", "pending")
      ).rejects.toThrow("SMTP Error");
    });
  });

  describe("sendPaymentReminderEmail", () => {
    it("should send payment reminder email with formatted amount", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTransporter.sendMail.mockResolvedValue({ messageId: "test-id" });

      await emailService.sendPaymentReminderEmail(mockUser.email!, "ORD-12345", 150.75);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Lembrete de Pagamento - Pedido #ORD-12345",
          html: expect.stringContaining("R$ 150,75"),
          text: expect.stringContaining("R$ 150,75"),
        })
      );
    });

    it("should throw error if email sending fails", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      const error = new Error("SMTP Error");
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        emailService.sendPaymentReminderEmail(mockUser.email!, "ORD-12345", 150.75)
      ).rejects.toThrow("SMTP Error");
    });
  });

  describe("testConnection", () => {
    it("should return true when connection is successful", async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.testConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it("should return false when connection fails", async () => {
      mockTransporter.verify.mockRejectedValue(new Error("Connection failed"));

      const result = await emailService.testConnection();

      expect(result).toBe(false);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });
}); 