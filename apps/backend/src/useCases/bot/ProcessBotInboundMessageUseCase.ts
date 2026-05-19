import {
  BOT_AGENDAMENTO_CONFIRMED_TEXT,
  BOT_AGENDAMENTO_DATA_TOO_SHORT,
  BOT_ASK_AGENDAMENTO_TEXT,
  BOT_ASK_CPF_TEXT,
  BOT_ASK_ORCAMENTO_TEXT,
  BOT_ASK_OS_TEXT,
  BOT_INVALID_OPTION_TEXT,
  BOT_MAIN_MENU_TEXT,
  BOT_ORCAMENTO_CONFIRMED_TEXT,
  BOT_ORCAMENTO_DATA_TOO_SHORT,
  buildSessionExpiredMenuText,
} from "../../constants/botChatMessages";
import type { BotWebhookResponse } from "../../dto/bot/BotWebhookDtos";
import { createBotWebhookFallbackResponse } from "../../dto/bot/BotWebhookDtos";
import { logger } from "../../config/logger";
import { BotChatSessionService } from "../../services/BotChatSessionService";
import { BotWhatsAppRequestService } from "../../services/BotWhatsAppRequestService";
import {
  formatDebtsResultMessage,
  formatOrderResultMessage,
} from "../../utils/botMessageFormatters";
import {
  isBackToMenuCommand,
  isBotChatSessionStatus,
  normalizeInboundText,
  normalizeRemoteJid,
  parseMenuOption,
} from "../../utils/botInboundNormalize";
import { AppError } from "../../utils/AppError";
import { GetBotCustomerDebtsByCpfUseCase } from "./GetBotCustomerDebtsByCpfUseCase";
import { GetBotOrderByOsUseCase } from "./GetBotOrderByOsUseCase";

const MIN_AGENDAMENTO_CONTENT_LENGTH = 15;
const MIN_ORCAMENTO_CONTENT_LENGTH = 10;

export class ProcessBotInboundMessageUseCase {
  constructor(
    private readonly sessionService: BotChatSessionService = new BotChatSessionService(),
    private readonly botWhatsAppRequestService: BotWhatsAppRequestService = new BotWhatsAppRequestService(),
    private readonly getBotOrderByOsUseCase: GetBotOrderByOsUseCase = new GetBotOrderByOsUseCase(),
    private readonly getBotCustomerDebtsByCpfUseCase: GetBotCustomerDebtsByCpfUseCase = new GetBotCustomerDebtsByCpfUseCase()
  ) {}

  async execute(
    remoteJidRaw: string,
    textRaw: string
  ): Promise<BotWebhookResponse> {
    const remoteJid = normalizeRemoteJid(remoteJidRaw);
    const text = normalizeInboundText(textRaw);

    logger.info("Bot inbound — início", { remoteJid, text });

    try {
      const response = await this.processMessage(remoteJid, text);
      logger.info("Bot inbound — fim", {
        remoteJid,
        action: response.action,
        sessionStatus: response.sessionStatus,
        textLength: response.text.length,
      });
      return response;
    } catch (err) {
      logger.error("Bot inbound — erro inesperado", {
        remoteJid,
        text,
        error: err instanceof Error ? err.message : String(err),
      });
      return createBotWebhookFallbackResponse();
    }
  }

  private async processMessage(
    remoteJid: string,
    text: string
  ): Promise<BotWebhookResponse> {
    const { session, expiredByInactivity } =
      await this.sessionService.lookupSession(remoteJid);

    if (!session) {
      await this.sessionService.openMenuSession(remoteJid);
      if (expiredByInactivity) {
        return {
          action: "SESSION_EXPIRED",
          text: buildSessionExpiredMenuText(),
          sessionStatus: "AGUARDANDO_OPCAO",
        };
      }
      return this.menuResponse(BOT_MAIN_MENU_TEXT, "AGUARDANDO_OPCAO");
    }

    const currentStatus = isBotChatSessionStatus(session.status)
      ? session.status
      : null;

    logger.info("Bot inbound — sessão existente", {
      remoteJid,
      status: session.status,
      text,
    });

    if (!currentStatus) {
      logger.warn("Bot inbound — status inválido no Mongo, resetando menu", {
        remoteJid,
        status: session.status,
      });
      await this.sessionService.openMenuSession(remoteJid);
      return this.menuResponse(BOT_MAIN_MENU_TEXT, "AGUARDANDO_OPCAO");
    }

    switch (currentStatus) {
      case "AGUARDANDO_OPCAO":
        return this.handleMenuOption(remoteJid, text);
      case "AGUARDANDO_OS":
        return this.handleOsInput(remoteJid, text);
      case "AGUARDANDO_CPF":
        return this.handleCpfInput(remoteJid, text);
      case "AGUARDANDO_AGENDAMENTO":
        return this.handleAgendamentoInput(remoteJid, text);
      case "AGUARDANDO_ORCAMENTO":
        return this.handleOrcamentoInput(remoteJid, text);
      default:
        await this.sessionService.openMenuSession(remoteJid);
        return this.menuResponse(BOT_MAIN_MENU_TEXT, "AGUARDANDO_OPCAO");
    }
  }

  private async returnToMainMenu(remoteJid: string): Promise<BotWebhookResponse> {
    await this.sessionService.openMenuSession(remoteJid);
    logger.info("Bot — cliente voltou ao menu (0)", { remoteJid });
    return this.menuResponse(BOT_MAIN_MENU_TEXT, "AGUARDANDO_OPCAO");
  }

  private async handleMenuOption(
    remoteJid: string,
    text: string
  ): Promise<BotWebhookResponse> {
    if (isBackToMenuCommand(text)) {
      return this.returnToMainMenu(remoteJid);
    }

    const option = parseMenuOption(text);

    switch (option) {
      case "1": {
        await this.sessionService.setStatus(remoteJid, "AGUARDANDO_OS");
        return {
          action: "ASK_OS",
          text: BOT_ASK_OS_TEXT,
          sessionStatus: "AGUARDANDO_OS",
        };
      }
      case "2": {
        await this.sessionService.setStatus(remoteJid, "AGUARDANDO_CPF");
        return {
          action: "ASK_CPF",
          text: BOT_ASK_CPF_TEXT,
          sessionStatus: "AGUARDANDO_CPF",
        };
      }
      case "3": {
        await this.sessionService.setStatus(remoteJid, "AGUARDANDO_AGENDAMENTO");
        return {
          action: "ASK_AGENDAMENTO",
          text: BOT_ASK_AGENDAMENTO_TEXT,
          sessionStatus: "AGUARDANDO_AGENDAMENTO",
        };
      }
      case "4": {
        await this.sessionService.setStatus(remoteJid, "AGUARDANDO_ORCAMENTO");
        return {
          action: "ASK_ORCAMENTO",
          text: BOT_ASK_ORCAMENTO_TEXT,
          sessionStatus: "AGUARDANDO_ORCAMENTO",
        };
      }
      default:
        return this.menuResponse(BOT_INVALID_OPTION_TEXT, "AGUARDANDO_OPCAO");
    }
  }

  private async handleOsInput(
    remoteJid: string,
    text: string
  ): Promise<BotWebhookResponse> {
    if (isBackToMenuCommand(text)) {
      return this.returnToMainMenu(remoteJid);
    }

    if (!text) {
      return {
        action: "ASK_OS",
        text: "Informe o número da O.S. para continuar.\n\n" + BOT_ASK_OS_TEXT,
        sessionStatus: "AGUARDANDO_OS",
      };
    }

    try {
      const order = await this.getBotOrderByOsUseCase.execute(text);
      await this.sessionService.closeSession(remoteJid);
      return {
        action: "ORDER_RESULT",
        text: formatOrderResultMessage(order),
        data: order,
        sessionStatus: null,
      };
    } catch (err) {
      return this.handleFlowError(remoteJid, err);
    }
  }

  private async handleCpfInput(
    remoteJid: string,
    text: string
  ): Promise<BotWebhookResponse> {
    if (isBackToMenuCommand(text)) {
      return this.returnToMainMenu(remoteJid);
    }

    if (!text) {
      return {
        action: "ASK_CPF",
        text: "Informe o CPF para continuar.\n\n" + BOT_ASK_CPF_TEXT,
        sessionStatus: "AGUARDANDO_CPF",
      };
    }

    try {
      const debts = await this.getBotCustomerDebtsByCpfUseCase.execute(text);
      await this.sessionService.closeSession(remoteJid);
      return {
        action: "DEBTS_RESULT",
        text: formatDebtsResultMessage(debts),
        data: debts,
        sessionStatus: null,
      };
    } catch (err) {
      return this.handleFlowError(remoteJid, err);
    }
  }

  private async handleAgendamentoInput(
    remoteJid: string,
    text: string
  ): Promise<BotWebhookResponse> {
    if (isBackToMenuCommand(text)) {
      return this.returnToMainMenu(remoteJid);
    }

    if (text.length < MIN_AGENDAMENTO_CONTENT_LENGTH) {
      return {
        action: "ASK_AGENDAMENTO",
        text: `${BOT_AGENDAMENTO_DATA_TOO_SHORT}\n\n${BOT_ASK_AGENDAMENTO_TEXT}`,
        sessionStatus: "AGUARDANDO_AGENDAMENTO",
      };
    }

    await this.botWhatsAppRequestService.registerRequest(
      remoteJid,
      "exam_scheduling",
      text
    );
    await this.sessionService.closeSession(remoteJid);

    return {
      action: "AGENDAMENTO_CONFIRMED",
      text: BOT_AGENDAMENTO_CONFIRMED_TEXT,
      sessionStatus: null,
    };
  }

  private async handleOrcamentoInput(
    remoteJid: string,
    text: string
  ): Promise<BotWebhookResponse> {
    if (isBackToMenuCommand(text)) {
      return this.returnToMainMenu(remoteJid);
    }

    if (text.length < MIN_ORCAMENTO_CONTENT_LENGTH) {
      return {
        action: "ASK_ORCAMENTO",
        text: `${BOT_ORCAMENTO_DATA_TOO_SHORT}\n\n${BOT_ASK_ORCAMENTO_TEXT}`,
        sessionStatus: "AGUARDANDO_ORCAMENTO",
      };
    }

    await this.botWhatsAppRequestService.registerRequest(
      remoteJid,
      "quote_request",
      text
    );
    await this.sessionService.closeSession(remoteJid);

    return {
      action: "ORCAMENTO_CONFIRMED",
      text: BOT_ORCAMENTO_CONFIRMED_TEXT,
      sessionStatus: null,
    };
  }

  private async handleFlowError(
    remoteJid: string,
    err: unknown
  ): Promise<BotWebhookResponse> {
    const message =
      err instanceof AppError
        ? err.message
        : "Não foi possível concluir a consulta. Tente novamente mais tarde.";

    await this.sessionService.openMenuSession(remoteJid);
    return {
      action: "SEND_MESSAGE",
      text: `${message}\n\n${BOT_MAIN_MENU_TEXT}`,
      sessionStatus: "AGUARDANDO_OPCAO",
    };
  }

  private menuResponse(
    text: string,
    sessionStatus: BotWebhookResponse["sessionStatus"]
  ): BotWebhookResponse {
    return {
      action: "SHOW_MENU",
      text,
      sessionStatus,
    };
  }
}
