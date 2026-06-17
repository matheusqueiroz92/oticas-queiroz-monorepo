import { BotChatSession } from "../schemas/BotChatSessionSchema";
import type { IBotChatSession } from "../interfaces/IBotChatSession";
import { normalizeRemoteJid } from "../utils/botInboundNormalize";

function parseDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value;
  }
  if (value != null) {
    const parsed = new Date(value as string | number);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }
  return fallback;
}

export class BotChatSessionModel {
  async findByRemoteJid(remoteJid: string): Promise<IBotChatSession | null> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    const doc = await BotChatSession.findOne({ remoteJid: normalizedJid }).exec();
    return doc ? this.toInterface(doc) : null;
  }

  async upsert(
    remoteJid: string,
    status: IBotChatSession["status"]
  ): Promise<IBotChatSession> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    const now = new Date();

    const doc = await BotChatSession.findOneAndUpdate(
      { remoteJid: normalizedJid },
      {
        $set: { status, updatedAt: now },
        $setOnInsert: {
          awaitingResponseSince: now,
          inactivityWarningSentAt: null,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    ).exec();

    if (!doc) {
      const refetched = await BotChatSession.findOne({
        remoteJid: normalizedJid,
      }).exec();
      if (!refetched) {
        throw new Error(
          `Falha ao persistir sessão do bot para remoteJid=${normalizedJid}`
        );
      }
      return this.toInterface(refetched);
    }

    return this.toInterface(doc);
  }

  async markAwaitingResponse(remoteJid: string): Promise<IBotChatSession | null> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    const now = new Date();

    const doc = await BotChatSession.findOneAndUpdate(
      { remoteJid: normalizedJid },
      {
        $set: {
          awaitingResponseSince: now,
          inactivityWarningSentAt: null,
          updatedAt: now,
        },
      },
      { new: true, runValidators: true }
    ).exec();

    return doc ? this.toInterface(doc) : null;
  }

  async recordUserActivity(remoteJid: string): Promise<IBotChatSession | null> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    const now = new Date();

    const doc = await BotChatSession.findOneAndUpdate(
      { remoteJid: normalizedJid },
      {
        $set: { inactivityWarningSentAt: null, updatedAt: now },
      },
      { new: true, runValidators: true }
    ).exec();

    return doc ? this.toInterface(doc) : null;
  }

  async markInactivityWarningSent(
    remoteJid: string
  ): Promise<IBotChatSession | null> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    const now = new Date();

    const doc = await BotChatSession.findOneAndUpdate(
      { remoteJid: normalizedJid },
      {
        $set: { inactivityWarningSentAt: now, updatedAt: now },
      },
      { new: true, runValidators: true }
    ).exec();

    return doc ? this.toInterface(doc) : null;
  }

  async findSessionsForInactivityWarning(
    before: Date
  ): Promise<IBotChatSession[]> {
    const docs = await BotChatSession.find({
      inactivityWarningSentAt: null,
      awaitingResponseSince: { $lt: before },
    }).exec();

    return docs.map((doc) => this.toInterface(doc));
  }

  async findSessionsForInactivityClose(
    before: Date
  ): Promise<IBotChatSession[]> {
    const docs = await BotChatSession.find({
      inactivityWarningSentAt: { $ne: null, $lt: before },
    }).exec();

    return docs.map((doc) => this.toInterface(doc));
  }

  async deleteByRemoteJid(remoteJid: string): Promise<void> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    await BotChatSession.deleteOne({ remoteJid: normalizedJid }).exec();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toInterface(doc: any): IBotChatSession {
    const activity = doc.toObject ? doc.toObject() : doc;

    const updatedAt = parseDate(activity.updatedAt, new Date());
    const createdAtRaw = activity.createdAt;
    const createdAt =
      createdAtRaw instanceof Date
        ? createdAtRaw
        : createdAtRaw != null
          ? new Date(createdAtRaw)
          : undefined;

    const awaitingResponseSince = parseDate(
      activity.awaitingResponseSince,
      updatedAt
    );
    const inactivityWarningSentAtRaw = activity.inactivityWarningSentAt;
    const inactivityWarningSentAt =
      inactivityWarningSentAtRaw == null
        ? null
        : parseDate(inactivityWarningSentAtRaw, updatedAt);

    return {
      _id: activity._id != null ? String(activity._id) : undefined,
      remoteJid: String(activity.remoteJid),
      status: activity.status as IBotChatSession["status"],
      awaitingResponseSince,
      inactivityWarningSentAt,
      updatedAt,
      createdAt:
        createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
    };
  }
}
