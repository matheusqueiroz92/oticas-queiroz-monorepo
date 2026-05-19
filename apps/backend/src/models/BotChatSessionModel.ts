import { BotChatSession } from "../schemas/BotChatSessionSchema";
import type { IBotChatSession } from "../interfaces/IBotChatSession";
import { normalizeRemoteJid } from "../utils/botInboundNormalize";

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
      { $set: { status, updatedAt: now } },
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

  async deleteByRemoteJid(remoteJid: string): Promise<void> {
    const normalizedJid = normalizeRemoteJid(remoteJid);
    await BotChatSession.deleteOne({ remoteJid: normalizedJid }).exec();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toInterface(doc: any): IBotChatSession {
    const activity = doc.toObject ? doc.toObject() : doc;

    const updatedAtRaw = activity.updatedAt;
    const updatedAt =
      updatedAtRaw instanceof Date
        ? updatedAtRaw
        : updatedAtRaw != null
          ? new Date(updatedAtRaw)
          : new Date();

    const createdAtRaw = activity.createdAt;
    const createdAt =
      createdAtRaw instanceof Date
        ? createdAtRaw
        : createdAtRaw != null
          ? new Date(createdAtRaw)
          : undefined;

    return {
      _id: activity._id != null ? String(activity._id) : undefined,
      remoteJid: String(activity.remoteJid),
      status: activity.status as IBotChatSession["status"],
      updatedAt: Number.isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
      createdAt:
        createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
    };
  }
}
