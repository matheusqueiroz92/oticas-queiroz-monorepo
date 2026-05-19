import type { Server } from "node:http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import {
  startWhatsAppConnection,
  stopWhatsAppConnection,
} from "./connection/whatsapp";
import { createApp, startHttpServer } from "./server/http";

let httpServer: Server | null = null;

async function main(): Promise<void> {
  logger.info("Iniciando whatsapp-bot", {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  });

  const app = createApp();
  httpServer = startHttpServer(app);

  void startWhatsAppConnection();
}

function shutdown(signal: string): void {
  logger.info(`Encerrando (${signal})...`);

  const closeHttp = new Promise<void>((resolve) => {
    if (!httpServer) {
      resolve();
      return;
    }
    httpServer.close(() => resolve());
  });

  void closeHttp.then(async () => {
    await stopWhatsAppConnection();
    process.exit(0);
  });

  setTimeout(() => {
    logger.warn("Shutdown forçado após timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((err) => {
  logger.error("Falha fatal no bootstrap", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
