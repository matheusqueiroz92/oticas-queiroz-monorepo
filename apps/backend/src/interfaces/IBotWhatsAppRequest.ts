export const BOT_WHATSAPP_REQUEST_TYPES = [
  "exam_scheduling",
  "quote_request",
] as const;

export type BotWhatsAppRequestType =
  (typeof BOT_WHATSAPP_REQUEST_TYPES)[number];

export interface IBotWhatsAppRequest {
  _id?: string;
  remoteJid: string;
  type: BotWhatsAppRequestType;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}
