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
botChatSessionSchema.index({ updatedAt: 1 });

export const BotChatSession = mongoose.model<BotChatSessionDocument>(
  "BotChatSession",
  botChatSessionSchema
);

export type { BotChatSessionStatus };
