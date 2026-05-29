import { BotChatSessionModel } from "../models/BotChatSessionModel";
import type {
  BotChatSessionStatus,
  BotSessionLookup,
  IBotChatSession,
} from "../interfaces/IBotChatSession";
import { normalizeRemoteJid } from "../utils/botInboundNormalize";
import { logger } from "../config/logger";
import { resolveSessionTtlMinutes } from "../constants/botChatMessages";

function resolveSessionTtlMs(): number {
  return resolveSessionTtlMinutes() * 60 * 1000;
}

export class BotChatSessionService {
  private readonly sessionTtlMs = resolveSessionTtlMs();

  constructor(
    private readonly sessionModel: BotChatSessionModel = new BotChatSessionModel()
  ) {}

  async lookupSession(remoteJid: string): Promise<BotSessionLookup> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    const session = await this.sessionModel.findByRemoteJid(normalizedJid);

    if (!session) {
      logger.debug("Bot session não encontrada", { remoteJid: normalizedJid });
      return { session: null, expiredByInactivity: false };
    }

    if (this.isExpired(session.updatedAt)) {
      logger.info("Bot session expirada — removendo", {
        remoteJid: normalizedJid,
        status: session.status,
        updatedAt: session.updatedAt.toISOString(),
      });
      await this.sessionModel.deleteByRemoteJid(normalizedJid);
      return { session: null, expiredByInactivity: true };
    }

    logger.debug("Bot session ativa carregada", {
      remoteJid: normalizedJid,
      status: session.status,
      updatedAt: session.updatedAt.toISOString(),
    });

    return { session, expiredByInactivity: false };
  }

  /** @deprecated Prefira {@link lookupSession} para distinguir expiração por inatividade. */
  async getActiveSession(remoteJid: string): Promise<IBotChatSession | null> {
    const { session } = await this.lookupSession(remoteJid);
    return session;
  }

  async openMenuSession(remoteJid: string): Promise<IBotChatSession> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    const session = await this.sessionModel.upsert(
      normalizedJid,
      "AGUARDANDO_OPCAO"
    );
    logger.info("Bot session aberta no menu", {
      remoteJid: normalizedJid,
      status: session.status,
    });
    return session;
  }

  async setStatus(
    remoteJid: string,
    status: BotChatSessionStatus
  ): Promise<IBotChatSession> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    const session = await this.sessionModel.upsert(normalizedJid, status);
    logger.info("Bot session — status atualizado", {
      remoteJid: normalizedJid,
      status: session.status,
    });
    return session;
  }

  async closeSession(remoteJid: string): Promise<void> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    await this.sessionModel.deleteByRemoteJid(normalizedJid);
    logger.info("Bot session encerrada", { remoteJid: normalizedJid });
  }

  isExpired(updatedAt: Date): boolean {
    const updatedMs = new Date(updatedAt).getTime();
    if (Number.isNaN(updatedMs)) return true;
    return Date.now() - updatedMs > this.sessionTtlMs;
  }
}
