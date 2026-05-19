import { BotWhatsAppRequest } from "../schemas/BotWhatsAppRequestSchema";
import type {
  BotWhatsAppRequestType,
  IBotWhatsAppRequest,
} from "../interfaces/IBotWhatsAppRequest";
import { normalizeRemoteJid } from "../utils/botInboundNormalize";

export class BotWhatsAppRequestModel {
  async create(
    remoteJid: string,
    type: BotWhatsAppRequestType,
    content: string
  ): Promise<IBotWhatsAppRequest> {
    const doc = await BotWhatsAppRequest.create({
      remoteJid: normalizeRemoteJid(remoteJid),
      type,
      content: content.trim(),
    });

    return this.toInterface(doc);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toInterface(doc: any): IBotWhatsAppRequest {
    const plain = doc.toObject ? doc.toObject() : doc;
    return {
      _id: plain._id != null ? String(plain._id) : undefined,
      remoteJid: String(plain.remoteJid),
      type: plain.type as BotWhatsAppRequestType,
      content: String(plain.content),
      createdAt:
        plain.createdAt instanceof Date
          ? plain.createdAt
          : plain.createdAt
            ? new Date(plain.createdAt)
            : undefined,
      updatedAt:
        plain.updatedAt instanceof Date
          ? plain.updatedAt
          : plain.updatedAt
            ? new Date(plain.updatedAt)
            : undefined,
    };
  }
}
