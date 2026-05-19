import { BotWhatsAppRequestModel } from "../models/BotWhatsAppRequestModel";
import type {
  BotWhatsAppRequestType,
  IBotWhatsAppRequest,
} from "../interfaces/IBotWhatsAppRequest";
import { logger } from "../config/logger";

export class BotWhatsAppRequestService {
  constructor(
    private readonly requestModel: BotWhatsAppRequestModel = new BotWhatsAppRequestModel()
  ) {}

  async registerRequest(
    remoteJid: string,
    type: BotWhatsAppRequestType,
    content: string
  ): Promise<IBotWhatsAppRequest> {
    const saved = await this.requestModel.create(remoteJid, type, content);
    logger.info("Solicitação WhatsApp registrada", {
      remoteJid: saved.remoteJid,
      type: saved.type,
      requestId: saved._id,
    });
    return saved;
  }
}
