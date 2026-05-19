import type { Request, Response, NextFunction } from "express";
import {
  botWebhookBodySchema,
  createBotWebhookFallbackResponse,
} from "../dto/bot/BotWebhookDtos";
import { logger } from "../config/logger";
import {
  GetBotOrderByOsUseCase,
  GetBotCustomerDebtsByCpfUseCase,
  ProcessBotInboundMessageUseCase,
} from "../services/BotService";

export class BotController {
  constructor(
    private readonly getBotOrderByOsUseCase: GetBotOrderByOsUseCase = new GetBotOrderByOsUseCase(),
    private readonly getBotCustomerDebtsByCpfUseCase: GetBotCustomerDebtsByCpfUseCase = new GetBotCustomerDebtsByCpfUseCase(),
    private readonly processBotInboundMessageUseCase: ProcessBotInboundMessageUseCase = new ProcessBotInboundMessageUseCase()
  ) {}

  getOrderByOs = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const payload = await this.getBotOrderByOsUseCase.execute(
      req.params.os_number ?? ""
    );
    res.status(200).json(payload);
  };

  getCustomerDebtsByCpf = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const payload = await this.getBotCustomerDebtsByCpfUseCase.execute(
      req.params.cpf ?? ""
    );
    res.status(200).json(payload);
  };

  processInboundMessage = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const body = botWebhookBodySchema.parse(req.body);

    // Log sem PII: apenas JID e tamanho do texto
    logger.info("POST /api/bot/chat — payload recebido", {
      remoteJid: body.remoteJid,
      textLength: body.text.length,
    });
    const payload = await this.processBotInboundMessageUseCase.execute(
      body.remoteJid,
      body.text
    );

    const safePayload =
      payload?.text && payload?.action
        ? payload
        : createBotWebhookFallbackResponse();

    logger.info("POST /api/bot/chat — resposta", {
      remoteJid: body.remoteJid,
      action: safePayload.action,
      sessionStatus: safePayload.sessionStatus,
    });

    res.status(200).json(safePayload);
  };
}
