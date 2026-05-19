import express, { type Express } from "express";
import helmet from "helmet";
import type { Server } from "node:http";
import { isWhatsAppConnected } from "../connection/whatsapp";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { sendMessageRouter } from "./routes/sendMessage";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      whatsapp: isWhatsAppConnected() ? "connected" : "disconnected",
    });
  });

  app.use(sendMessageRouter);

  return app;
}

export function startHttpServer(app: Express): Server {
  return app.listen(env.PORT, () => {
    logger.info(`HTTP server listening on port ${env.PORT}`);
  });
}
