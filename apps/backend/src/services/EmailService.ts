import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export class EmailService {
  private transporter;

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
      debug: true, // Adicione isso para ver logs detalhados
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ): Promise<void> {
    // Certifique-se de que o resetLink tem o protocolo (http:// ou https://)
    const fullResetLink = resetLink.startsWith("http")
      ? resetLink
      : `http://localhost:3000${resetLink.startsWith("/") ? resetLink : `/${resetLink}`}`;

    try {
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
        // Também incluir uma versão de texto puro para melhor compatibilidade
        text: `
          Recuperação de Senha - Óticas Queiroz
          
          Você solicitou a recuperação de senha para sua conta na Óticas Queiroz.
          
          Para redefinir sua senha, acesse o link abaixo:
          ${fullResetLink}
          
          Este link é válido por 1 hora.
          
          Se você não solicitou esta recuperação, ignore este email.
        `,
      });

      console.log(`Email de recuperação enviado para: ${email}`);
      console.log(`Link enviado: ${fullResetLink}`);
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      throw error;
    }
  }
}
