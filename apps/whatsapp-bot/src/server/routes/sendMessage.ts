import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getWhatsAppSocket, isWhatsAppConnected } from "../../connection/whatsapp";
import { logger } from "../../config/logger";
import { botApiKeyMiddleware } from "../../middlewares/botApiKeyMiddleware";
import { sendWhatsAppText } from "../../services/whatsappSendService";

const sendMessageSchema = z.object({
  remoteJid: z
    .string()
    .min(1, "remoteJid é obrigatório")
    .refine(
      (jid) => jid.includes("@"),
      "remoteJid deve ser um JID válido (ex: 5511999999999@s.whatsapp.net)"
    ),
  text: z.string().min(1, "text é obrigatório"),
});

export const sendMessageRouter = Router();

sendMessageRouter.post(
  "/send-message",
  botApiKeyMiddleware,
  async (req: Request, res: Response) => {
    const parsed = sendMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join("; ");
      res.status(400).json({ status: "error", message });
      return;
    }

    if (!isWhatsAppConnected()) {
      res.status(503).json({
        status: "error",
        message: "WhatsApp não está conectado.",
      });
      return;
    }

    const sock = getWhatsAppSocket();
    if (!sock) {
      res.status(503).json({
        status: "error",
        message: "Socket WhatsApp indisponível.",
      });
      return;
    }

    const { remoteJid, text } = parsed.data;

    try {
      const outboundJid = await sendWhatsAppText(sock, remoteJid, text);
      logger.info("Mensagem enviada", { remoteJid, outboundJid });
      res.status(200).json({ success: true });
    } catch (err) {
      logger.error("Falha ao enviar mensagem", {
        remoteJid,
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({
        status: "error",
        message: "Falha ao enviar mensagem pelo WhatsApp.",
      });
    }
  }
);
