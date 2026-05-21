import path from "node:path";
import type { Server } from "node:http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import {
  startWhatsAppConnection,
  stopWhatsAppConnection,
} from "./connection/whatsapp";
import { createApp, startHttpServer } from "./server/http";
import { loadLidCacheFromDisk } from "./utils/jidResolver";

let httpServer: Server | null = null;

async function main(): Promise<void> {
  logger.info("Iniciando whatsapp-bot", {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  });

  // Carrega mapeamentos LID→JID persistidos em disco (sobrevive reinicializações).
  // O arquivo fica dentro de WA_SESSION_PATH (pasta auth), que é o volume Docker montado
  // — assim os mapeamentos sobrevivem a recreações de container (A5).
  const lidCachePath = path.join(env.WA_SESSION_PATH, "lid-cache.json");
  await loadLidCacheFromDisk(lidCachePath);

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
