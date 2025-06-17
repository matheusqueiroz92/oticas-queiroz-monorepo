import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { getRepositories } from "../repositories/RepositoryFactory";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";

dotenv.config();

export class EmailService {
  private transporter;
  private userRepository: IUserRepository;

  constructor() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (!user || !pass) {
      console.error("ERRO: Credenciais de email não configuradas!");
      console.error("Defina EMAIL_USER e EMAIL_PASSWORD no arquivo .env");
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user,
        pass,
      },
      debug: true,
    });

    const { userRepository } = getRepositories();
    this.userRepository = userRepository;
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ): Promise<void> {
    const fullResetLink = resetLink.startsWith("http")
      ? resetLink
      : `http://localhost:3000${resetLink.startsWith("/") ? resetLink : `/${resetLink}`}`;

    try {
      // Buscar o usuário para personalizar o email
      const user = await this.userRepository.findByEmail(email);
      const userName = user?.name || "Usuário";

      // Aqui estamos usando um HTML mais rigoroso para o email,
      // com estilos inline para melhor compatibilidade com clientes de email
      await this.transporter.sendMail({
        from: `"Óticas Queiroz" <${process.env.EMAIL_USER || "no-reply@oticasqueiroz.com"}>`,
        to: email,
        subject: "Recuperação de Senha",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Recuperação de Senha</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border: 1px solid #ddd;">
              <h1 style="color: #0056b3; margin-top: 0;">Recuperação de Senha</h1>
              <p>Olá ${userName},</p>
              <p>Você solicitou a recuperação de senha para sua conta na Óticas Queiroz.</p>
              <p>Clique no botão abaixo para redefinir sua senha:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${fullResetLink}" style="background-color: #0056b3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Redefinir minha senha</a>
              </div>
              
              <p>Se o botão acima não funcionar, copie e cole o link abaixo em seu navegador:</p>
              <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 3px;">${fullResetLink}</p>
              
              <p>Este link é válido por 1 hora.</p>
              <p>Se você não solicitou esta recuperação, ignore este email.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">Este é um email automático, por favor não responda.</p>
            </div>
          </body>
          </html>
        `,
        text: `
          Recuperação de Senha - Óticas Queiroz
          
          Olá ${userName},
          
          Você solicitou a recuperação de senha para sua conta na Óticas Queiroz.
          
          Para redefinir sua senha, acesse o link abaixo:
          ${fullResetLink}
          
          Este link é válido por 1 hora.
          
          Se você não solicitou esta recuperação, ignore este email.
        `,
      });
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      throw error;
    }
  }

  // Novos métodos usando repository
  async sendWelcomeEmail(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      const userName = user?.name || "Usuário";

      await this.transporter.sendMail({
        from: `"Óticas Queiroz" <${process.env.EMAIL_USER || "no-reply@oticasqueiroz.com"}>`,
        to: email,
        subject: "Bem-vindo à Óticas Queiroz!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Bem-vindo à Óticas Queiroz</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border: 1px solid #ddd;">
              <h1 style="color: #0056b3; margin-top: 0;">Bem-vindo à Óticas Queiroz!</h1>
              <p>Olá ${userName},</p>
              <p>Seja bem-vindo(a) à Óticas Queiroz! Sua conta foi criada com sucesso.</p>
              <p>Agora você pode:</p>
              <ul>
                <li>Acompanhar seus pedidos</li>
                <li>Visualizar seu histórico de compras</li>
                <li>Gerenciar suas informações pessoais</li>
              </ul>
              <p>Se tiver alguma dúvida, não hesite em nos contatar.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">Este é um email automático, por favor não responda.</p>
            </div>
          </body>
          </html>
        `,
        text: `
          Bem-vindo à Óticas Queiroz!
          
          Olá ${userName},
          
          Seja bem-vindo(a) à Óticas Queiroz! Sua conta foi criada com sucesso.
          
          Agora você pode:
          - Acompanhar seus pedidos
          - Visualizar seu histórico de compras
          - Gerenciar suas informações pessoais
          
          Se tiver alguma dúvida, não hesite em nos contatar.
        `,
      });
    } catch (error) {
      console.error("Erro ao enviar email de boas-vindas:", error);
      throw error;
    }
  }

  async sendOrderStatusEmail(
    email: string, 
    orderNumber: string, 
    newStatus: string
  ): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      const userName = user?.name || "Cliente";

      const statusMessages = {
        pending: "Seu pedido foi recebido e está sendo processado.",
        in_production: "Seu pedido está sendo produzido em nosso laboratório.",
        ready: "Seu pedido está pronto para retirada!",
        delivered: "Seu pedido foi entregue com sucesso.",
        cancelled: "Seu pedido foi cancelado."
      };

      const message = statusMessages[newStatus as keyof typeof statusMessages] || 
                     `Status do seu pedido foi atualizado para: ${newStatus}`;

      await this.transporter.sendMail({
        from: `"Óticas Queiroz" <${process.env.EMAIL_USER || "no-reply@oticasqueiroz.com"}>`,
        to: email,
        subject: `Atualização do Pedido #${orderNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Atualização do Pedido</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border: 1px solid #ddd;">
              <h1 style="color: #0056b3; margin-top: 0;">Atualização do Pedido #${orderNumber}</h1>
              <p>Olá ${userName},</p>
              <p>${message}</p>
              <p>Se tiver alguma dúvida, entre em contato conosco.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">Este é um email automático, por favor não responda.</p>
            </div>
          </body>
          </html>
        `,
        text: `
          Atualização do Pedido #${orderNumber}
          
          Olá ${userName},
          
          ${message}
          
          Se tiver alguma dúvida, entre em contato conosco.
        `,
      });
    } catch (error) {
      console.error("Erro ao enviar email de status do pedido:", error);
      throw error;
    }
  }

  async sendPaymentReminderEmail(
    email: string, 
    orderNumber: string, 
    dueAmount: number
  ): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email);
      const userName = user?.name || "Cliente";

      await this.transporter.sendMail({
        from: `"Óticas Queiroz" <${process.env.EMAIL_USER || "no-reply@oticasqueiroz.com"}>`,
        to: email,
        subject: `Lembrete de Pagamento - Pedido #${orderNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Lembrete de Pagamento</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border: 1px solid #ddd;">
              <h1 style="color: #0056b3; margin-top: 0;">Lembrete de Pagamento</h1>
              <p>Olá ${userName},</p>
              <p>Este é um lembrete sobre o pagamento pendente do seu pedido #${orderNumber}.</p>
              <p><strong>Valor em aberto: R$ ${dueAmount.toFixed(2).replace('.', ',')}</strong></p>
              <p>Entre em contato conosco para regularizar o pagamento.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">Este é um email automático, por favor não responda.</p>
            </div>
          </body>
          </html>
        `,
        text: `
          Lembrete de Pagamento
          
          Olá ${userName},
          
          Este é um lembrete sobre o pagamento pendente do seu pedido #${orderNumber}.
          
          Valor em aberto: R$ ${dueAmount.toFixed(2).replace('.', ',')}
          
          Entre em contato conosco para regularizar o pagamento.
        `,
      });
    } catch (error) {
      console.error("Erro ao enviar lembrete de pagamento:", error);
      throw error;
    }
  }

  // Método utilitário para testar conexão
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Erro na conexão de email:", error);
      return false;
    }
  }
}
