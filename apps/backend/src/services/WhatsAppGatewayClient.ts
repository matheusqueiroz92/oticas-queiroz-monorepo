import { botEnv } from "../config/botEnv";
import { logger } from "../config/logger";

export interface SendWhatsAppMessageResult {
  success: boolean;
  statusCode?: number;
  message?: string;
}

export class WhatsAppGatewayClient {
  constructor(
    private readonly baseUrl: string = botEnv.whatsappBotUrl,
    private readonly apiKey: string | undefined = process.env.BOT_API_KEY?.trim()
  ) {}

  async sendText(
    remoteJid: string,
    text: string
  ): Promise<SendWhatsAppMessageResult> {
    if (!this.apiKey) {
      logger.warn("WhatsAppGatewayClient: BOT_API_KEY não configurada");
      return { success: false, message: "BOT_API_KEY não configurada" };
    }

    const url = `${this.baseUrl.replace(/\/$/, "")}/send-message`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({ remoteJid, text }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        logger.warn("WhatsAppGatewayClient: falha ao enviar mensagem", {
          remoteJid,
          statusCode: response.status,
          body: body.slice(0, 200),
        });
        return {
          success: false,
          statusCode: response.status,
          message: body || response.statusText,
        };
      }

      return { success: true, statusCode: response.status };
    } catch (err) {
      logger.error("WhatsAppGatewayClient: erro de rede", {
        remoteJid,
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
