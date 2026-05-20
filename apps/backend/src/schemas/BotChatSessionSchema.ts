import mongoose, { Schema, type Document } from "mongoose";
import {
  BOT_CHAT_SESSION_STATUSES,
  type BotChatSessionStatus,
  type IBotChatSession,
} from "../interfaces/IBotChatSession";

interface BotChatSessionDocument
  extends Document,
    Omit<IBotChatSession, "_id"> {}

const botChatSessionSchema = new Schema<BotChatSessionDocument>(
  {
    remoteJid: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: BOT_CHAT_SESSION_STATUSES,
    },
  },
  { timestamps: true }
);

botChatSessionSchema.index({ remoteJid: 1 }, { unique: true });
// TTL index: MongoDB remove automaticamente sessões inativas há mais de 30 min (M4).
// O valor deve ser mantido em sincronia com DEFAULT_SESSION_TTL_MS em BotChatSessionService.ts.
botChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 60 });

export const BotChatSession = mongoose.model<BotChatSessionDocument>(
  "BotChatSession",
  botChatSessionSchema
);

export type { BotChatSessionStatus };
