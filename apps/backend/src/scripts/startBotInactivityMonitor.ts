import { botEnv } from "../config/botEnv";
import { logger } from "../config/logger";
import { BotInactivityMonitorService } from "../services/BotInactivityMonitorService";

let monitorService: BotInactivityMonitorService | null = null;

/**
 * Inicia o monitor proativo de inatividade do chatbot WhatsApp.
 * Deve ser chamado após a conexão com o MongoDB estar disponível.
 */
export async function startBotInactivityMonitor(): Promise<void> {
  if (!botEnv.inactivityMonitorEnabled) {
    logger.info("BotInactivityMonitor: desabilitado via BOT_INACTIVITY_MONITOR_ENABLED");
    return;
  }

  try {
    monitorService = new BotInactivityMonitorService();
    monitorService.startAutoMonitor();
  } catch (error) {
    logger.error("BotInactivityMonitor: falha ao iniciar", { error });
  }
}

export function stopBotInactivityMonitor(): void {
  monitorService?.stopAutoMonitor();
  monitorService = null;
}
