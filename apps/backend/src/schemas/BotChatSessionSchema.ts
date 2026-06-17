import mongoose, { Schema, type Document } from "mongoose";
import { botEnv } from "../config/botEnv";
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
    awaitingResponseSince: { type: Date, required: true, default: Date.now },
    inactivityWarningSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

botChatSessionSchema.index({ remoteJid: 1 }, { unique: true });
botChatSessionSchema.index(
  { awaitingResponseSince: 1, inactivityWarningSentAt: 1 },
  { name: "inactivity_monitor" }
);
// TTL index: remove sessões órfãs após BOT_SESSION_TTL_MINUTES sem atualização.
botChatSessionSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: botEnv.sessionTtlMinutes * 60 }
);

export const BotChatSession = mongoose.model<BotChatSessionDocument>(
  "BotChatSession",
  botChatSessionSchema
);

export type { BotChatSessionStatus };
