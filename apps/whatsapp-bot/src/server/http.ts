import express, { type Express } from "express";
import helmet from "helmet";
import QRCode from "qrcode";
import type { Server } from "node:http";
import { isWhatsAppConnected, getLatestQrCode } from "../connection/whatsapp";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { sendMessageRouter } from "./routes/sendMessage";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  // ── Health check ────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      whatsapp: isWhatsAppConnected() ? "connected" : "disconnected",
    });
  });

  // ── QR Code (C1) ────────────────────────────────────────────────────────
  // Endpoint interno para reautenticação WhatsApp sem acesso manual aos logs.
  // Acessível via SSH tunnel: ssh -L 3344:localhost:3344 root@<server>
  // e depois abrir http://localhost:3344/qr no navegador.
  app.get("/qr", async (_req, res) => {
    if (isWhatsAppConnected()) {
      res.status(200).json({
        status: "connected",
        message: "WhatsApp já está conectado. Nenhum QR necessário.",
      });
      return;
    }

    const qrString = getLatestQrCode();

    if (!qrString) {
      res.status(202).json({
        status: "starting",
        message: "Aguardando geração do QR Code. Tente novamente em alguns segundos.",
      });
      return;
    }

    try {
      const qrDataUrl = await QRCode.toDataURL(qrString, { scale: 8 });

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="15" />
  <title>WhatsApp QR Code — Óticas Queiroz</title>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column;
           align-items: center; justify-content: center; min-height: 100vh;
           margin: 0; background: #f5f5f5; color: #333; }
    .card { background: #fff; border-radius: 12px; padding: 32px 40px;
            box-shadow: 0 2px 16px rgba(0,0,0,.1); text-align: center; }
    h1 { font-size: 1.3rem; margin-bottom: 8px; }
    p  { color: #666; font-size: .9rem; margin-bottom: 24px; }
    img { display: block; border: 1px solid #ddd; border-radius: 8px; }
    .note { margin-top: 16px; font-size: .8rem; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📱 Escaneie com o WhatsApp</h1>
    <p>Abra o WhatsApp → Dispositivos vinculados → Vincular um dispositivo</p>
    <img src="${qrDataUrl}" alt="QR Code WhatsApp" />
    <p class="note">Esta página atualiza automaticamente a cada 15 segundos.<br/>
       O QR Code expira em aproximadamente 20 segundos.</p>
  </div>
</body>
</html>`);
    } catch (err) {
      logger.error("Falha ao gerar imagem do QR Code", {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ status: "error", message: "Falha ao gerar QR Code." });
    }
  });

  app.use(sendMessageRouter);

  return app;
}

export function startHttpServer(app: Express): Server {
  return app.listen(env.PORT, () => {
    logger.info(`HTTP server listening on port ${env.PORT}`);
  });
}
