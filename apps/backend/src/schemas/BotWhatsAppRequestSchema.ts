import mongoose, { Schema, type Document } from "mongoose";
import {
  BOT_WHATSAPP_REQUEST_TYPES,
  type BotWhatsAppRequestType,
  type IBotWhatsAppRequest,
} from "../interfaces/IBotWhatsAppRequest";

interface BotWhatsAppRequestDocument
  extends Document,
    Omit<IBotWhatsAppRequest, "_id"> {}

const botWhatsAppRequestSchema = new Schema<BotWhatsAppRequestDocument>(
  {
    remoteJid: { type: String, required: true, trim: true, index: true },
    type: {
      type: String,
      required: true,
      enum: BOT_WHATSAPP_REQUEST_TYPES,
      index: true,
    },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

botWhatsAppRequestSchema.index({ createdAt: -1 });

export const BotWhatsAppRequest = mongoose.model<BotWhatsAppRequestDocument>(
  "BotWhatsAppRequest",
  botWhatsAppRequestSchema
);

export type { BotWhatsAppRequestType };
