import { botEnv } from "../config/botEnv";
import {
  buildConversationClosedText,
  buildInactivityWarningText,
} from "../constants/botChatMessages";
import { logger } from "../config/logger";
import { BotChatSessionService } from "./BotChatSessionService";
import { WhatsAppGatewayClient } from "./WhatsAppGatewayClient";

export class BotInactivityMonitorService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunningCycle = false;

  constructor(
    private readonly sessionService: BotChatSessionService = new BotChatSessionService(),
    private readonly gatewayClient: WhatsAppGatewayClient = new WhatsAppGatewayClient()
  ) {}

  startAutoMonitor(pollIntervalSeconds?: number): void {
    if (this.intervalId) {
      logger.warn("BotInactivityMonitor: monitor já está em execução");
      return;
    }

    const intervalMs =
      (pollIntervalSeconds ?? botEnv.inactivityPollIntervalSeconds) * 1000;

    logger.info("BotInactivityMonitor: iniciando monitor de inatividade", {
      pollIntervalSeconds: intervalMs / 1000,
      warningMinutes: botEnv.inactivityWarningMinutes,
      closeMinutes: botEnv.inactivityCloseMinutes,
    });

    this.intervalId = setInterval(() => {
      void this.runCycle().catch((error) => {
        logger.error("BotInactivityMonitor: erro no ciclo", { error });
      });
    }, intervalMs);
  }

  stopAutoMonitor(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("BotInactivityMonitor: monitor parado");
    }
  }

  async runCycle(): Promise<void> {
    if (this.isRunningCycle) {
      return;
    }

    this.isRunningCycle = true;
    try {
      await this.processInactivityWarnings();
      await this.processInactivityClosures();
    } finally {
      this.isRunningCycle = false;
    }
  }

  private async processInactivityWarnings(): Promise<void> {
    const warningMs = botEnv.inactivityWarningMinutes * 60 * 1000;
    const threshold = new Date(Date.now() - warningMs);
    const sessions =
      await this.sessionService.findSessionsForInactivityWarning(threshold);

    for (const session of sessions) {
      const result = await this.gatewayClient.sendText(
        session.remoteJid,
        buildInactivityWarningText()
      );

      if (!result.success) {
        logger.warn("BotInactivityMonitor: aviso não enviado, tentará no próximo ciclo", {
          remoteJid: session.remoteJid,
        });
        continue;
      }

      await this.sessionService.markInactivityWarningSent(session.remoteJid);
    }
  }

  private async processInactivityClosures(): Promise<void> {
    const closeMs = botEnv.inactivityCloseMinutes * 60 * 1000;
    const threshold = new Date(Date.now() - closeMs);
    const sessions =
      await this.sessionService.findSessionsForInactivityClose(threshold);

    for (const session of sessions) {
      const result = await this.gatewayClient.sendText(
        session.remoteJid,
        buildConversationClosedText()
      );

      if (!result.success) {
        logger.warn("BotInactivityMonitor: encerramento não enviado, tentará no próximo ciclo", {
          remoteJid: session.remoteJid,
        });
        continue;
      }

      await this.sessionService.closeSession(session.remoteJid);
      logger.info("BotInactivityMonitor: conversa encerrada por inatividade", {
        remoteJid: session.remoteJid,
        status: session.status,
      });
    }
  }
}
