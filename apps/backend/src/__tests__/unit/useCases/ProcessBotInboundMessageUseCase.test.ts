import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ProcessBotInboundMessageUseCase } from "../../../useCases/bot/ProcessBotInboundMessageUseCase";
import type { BotChatSessionService } from "../../../services/BotChatSessionService";
import type { BotWhatsAppRequestService } from "../../../services/BotWhatsAppRequestService";
import type { GetBotOrderByOsUseCase } from "../../../useCases/bot/GetBotOrderByOsUseCase";
import type { GetBotCustomerDebtsByCpfUseCase } from "../../../useCases/bot/GetBotCustomerDebtsByCpfUseCase";
import {
  BOT_ASK_AGENDAMENTO_TEXT,
  BOT_ASK_ORCAMENTO_TEXT,
} from "../../../constants/botChatMessages";
import { NotFoundError } from "../../../utils/AppError";
import { ErrorCode } from "../../../utils/errorCodes";
import {
  BOT_ASK_CPF_TEXT,
  BOT_ASK_OS_TEXT,
  BOT_MAIN_MENU_TEXT,
  buildSessionExpiredMenuText,
} from "../../../constants/botChatMessages";

const jid = "5511999999999@s.whatsapp.net";

function lookupWithSession(
  status:
    | "AGUARDANDO_OPCAO"
    | "AGUARDANDO_OS"
    | "AGUARDANDO_CPF"
    | "AGUARDANDO_AGENDAMENTO"
    | "AGUARDANDO_ORCAMENTO"
) {
  return {
    session: {
      remoteJid: jid,
      status,
      updatedAt: new Date(),
    },
    expiredByInactivity: false,
  };
}

describe("ProcessBotInboundMessageUseCase", () => {
  let useCase: ProcessBotInboundMessageUseCase;
  let mockSession: jest.Mocked<
    Pick<
      BotChatSessionService,
      "lookupSession" | "openMenuSession" | "setStatus" | "closeSession"
    >
  >;
  let mockOrder: jest.Mocked<Pick<GetBotOrderByOsUseCase, "execute">>;
  let mockDebts: jest.Mocked<Pick<GetBotCustomerDebtsByCpfUseCase, "execute">>;
  let mockRequests: { registerRequest: jest.Mock };

  beforeEach(() => {
    mockSession = {
      lookupSession: jest.fn(),
      openMenuSession: jest.fn(),
      setStatus: jest.fn(),
      closeSession: jest.fn(),
    };
    mockOrder = { execute: jest.fn() };
    mockDebts = { execute: jest.fn() };
    mockRequests = {
      registerRequest: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        _id: "req-1",
        remoteJid: jid,
        type: "exam_scheduling",
        content: "dados",
      }),
    };

    mockSession.openMenuSession.mockResolvedValue({
      remoteJid: jid,
      status: "AGUARDANDO_OPCAO",
      updatedAt: new Date(),
    });
    mockSession.setStatus.mockImplementation(async (_jid, status) => ({
      remoteJid: jid,
      status,
      updatedAt: new Date(),
    }));

    useCase = new ProcessBotInboundMessageUseCase(
      mockSession as unknown as BotChatSessionService,
      mockRequests as unknown as BotWhatsAppRequestService,
      mockOrder as unknown as GetBotOrderByOsUseCase,
      mockDebts as unknown as GetBotCustomerDebtsByCpfUseCase
    );
  });

  it("creates session and shows menu on first contact", async () => {
    mockSession.lookupSession.mockResolvedValue({
      session: null,
      expiredByInactivity: false,
    });

    const r = await useCase.execute(jid, "Oi");

    expect(mockSession.openMenuSession).toHaveBeenCalledWith(jid);
    expect(r.action).toBe("SHOW_MENU");
    expect(r.text).toBe(BOT_MAIN_MENU_TEXT);
    expect(r.sessionStatus).toBe("AGUARDANDO_OPCAO");
  });

  it("notifies inactivity expiry and shows menu when session timed out", async () => {
    mockSession.lookupSession.mockResolvedValue({
      session: null,
      expiredByInactivity: true,
    });

    const r = await useCase.execute(jid, "1");

    expect(mockSession.openMenuSession).toHaveBeenCalledWith(jid);
    expect(r.action).toBe("SESSION_EXPIRED");
    expect(r.text).toBe(buildSessionExpiredMenuText());
    expect(r.text).toContain("inatividade");
    expect(r.sessionStatus).toBe("AGUARDANDO_OPCAO");
  });

  it("option 1 moves to AGUARDANDO_OS", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_OPCAO")
    );

    const r = await useCase.execute(jid, "1");

    expect(mockSession.setStatus).toHaveBeenCalledWith(jid, "AGUARDANDO_OS");
    expect(r.action).toBe("ASK_OS");
    expect(r.text).toBe(BOT_ASK_OS_TEXT);
  });

  it("option 2 moves to AGUARDANDO_CPF", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_OPCAO")
    );

    const r = await useCase.execute(jid, "2");

    expect(mockSession.setStatus).toHaveBeenCalledWith(jid, "AGUARDANDO_CPF");
    expect(r.action).toBe("ASK_CPF");
    expect(r.text).toBe(BOT_ASK_CPF_TEXT);
  });

  it("invalid menu option resends menu", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_OPCAO")
    );

    const r = await useCase.execute(jid, "xyz");

    expect(r.action).toBe("SHOW_MENU");
    expect(r.text).toContain("Opção inválida");
  });

  it("AGUARDANDO_OS queries order and closes session", async () => {
    mockSession.lookupSession.mockResolvedValue(lookupWithSession("AGUARDANDO_OS"));
    mockOrder.execute.mockResolvedValue({
      serviceOrder: "300001",
      status: "ready",
      paymentStatus: "paid",
      orderDate: "2025-01-01T00:00:00.000Z",
      deliveryDate: null,
      totalPrice: 100,
      totalPaid: 100,
      remainingAmount: 0,
    });

    const r = await useCase.execute(jid, "300001");

    expect(mockOrder.execute).toHaveBeenCalledWith("300001");
    expect(mockSession.closeSession).toHaveBeenCalledWith(jid);
    expect(r.action).toBe("ORDER_RESULT");
    expect(r.sessionStatus).toBeNull();
    expect(r.text).toContain("300001");
  });

  it("AGUARDANDO_CPF queries debts and closes session", async () => {
    mockSession.lookupSession.mockResolvedValue(lookupWithSession("AGUARDANDO_CPF"));
    mockDebts.execute.mockResolvedValue({
      cpf: "12345678901",
      totalDebt: 0,
      pendingDebts: [],
    });

    const r = await useCase.execute(jid, "123.456.789-01");

    expect(mockDebts.execute).toHaveBeenCalledWith("123.456.789-01");
    expect(mockSession.closeSession).toHaveBeenCalledWith(jid);
    expect(r.action).toBe("DEBTS_RESULT");
    expect(r.sessionStatus).toBeNull();
  });

  it("flow error reopens menu with message", async () => {
    mockSession.lookupSession.mockResolvedValue(lookupWithSession("AGUARDANDO_OS"));
    mockOrder.execute.mockRejectedValue(
      new NotFoundError("Pedido não encontrado", ErrorCode.RESOURCE_NOT_FOUND)
    );

    const r = await useCase.execute(jid, "999");

    expect(mockSession.openMenuSession).toHaveBeenCalledWith(jid);
    expect(r.action).toBe("SEND_MESSAGE");
    expect(r.text).toContain("Pedido não encontrado");
    expect(r.text).toContain(BOT_MAIN_MENU_TEXT);
  });

  it("option 3 shows exam price and asks for patient data", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_OPCAO")
    );

    const r = await useCase.execute(jid, "3");

    expect(r.action).toBe("ASK_AGENDAMENTO");
    expect(r.text).toBe(BOT_ASK_AGENDAMENTO_TEXT);
    expect(r.text).toContain("R$");
    expect(r.text).toContain("150");
    expect(mockSession.setStatus).toHaveBeenCalledWith(
      jid,
      "AGUARDANDO_AGENDAMENTO"
    );
  });

  it("option 4 asks for prescription or glasses info", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_OPCAO")
    );

    const r = await useCase.execute(jid, "4");

    expect(r.action).toBe("ASK_ORCAMENTO");
    expect(r.text).toBe(BOT_ASK_ORCAMENTO_TEXT);
    expect(r.text).toContain("receita");
  });

  it("agendamento registers request and confirms", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_AGENDAMENTO")
    );

    const dados =
      "Maria Silva\n(77) 98888-7777\nRua A, 10, Centro, Vitória da Conquista";
    const r = await useCase.execute(jid, dados);

    expect(mockRequests.registerRequest).toHaveBeenCalledWith(
      jid,
      "exam_scheduling",
      dados
    );
    expect(mockSession.closeSession).toHaveBeenCalledWith(jid);
    expect(r.action).toBe("AGENDAMENTO_CONFIRMED");
    expect(r.sessionStatus).toBeNull();
  });

  it("orcamento registers request and confirms", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_ORCAMENTO")
    );

    const dados = "Receita OD -2.00 esf / OE -1.75, lente multifocal";
    const r = await useCase.execute(jid, dados);

    expect(mockRequests.registerRequest).toHaveBeenCalledWith(
      jid,
      "quote_request",
      dados
    );
    expect(r.action).toBe("ORCAMENTO_CONFIRMED");
  });

  it("returns to menu when user sends 0 during agendamento flow", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_AGENDAMENTO")
    );

    const r = await useCase.execute(jid, "0");

    expect(mockSession.openMenuSession).toHaveBeenCalledWith(jid);
    expect(mockRequests.registerRequest).not.toHaveBeenCalled();
    expect(r.action).toBe("SHOW_MENU");
    expect(r.text).toBe(BOT_MAIN_MENU_TEXT);
  });

  it("returns to menu when user sends 0 during orcamento flow", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_ORCAMENTO")
    );

    const r = await useCase.execute(jid, "0");

    expect(r.action).toBe("SHOW_MENU");
    expect(mockRequests.registerRequest).not.toHaveBeenCalled();
  });

  it("returns to menu when user sends 0 from main menu wait", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_OPCAO")
    );

    const r = await useCase.execute(jid, "0");

    expect(r.action).toBe("SHOW_MENU");
    expect(r.text).toBe(BOT_MAIN_MENU_TEXT);
  });

  it("returns to menu when user sends 0 during OS flow", async () => {
    mockSession.lookupSession.mockResolvedValue(lookupWithSession("AGUARDANDO_OS"));

    const r = await useCase.execute(jid, "0");

    expect(mockOrder.execute).not.toHaveBeenCalled();
    expect(r.action).toBe("SHOW_MENU");
  });

  it("returns to menu when user sends 0 during CPF flow", async () => {
    mockSession.lookupSession.mockResolvedValue(lookupWithSession("AGUARDANDO_CPF"));

    const r = await useCase.execute(jid, "0");

    expect(mockDebts.execute).not.toHaveBeenCalled();
    expect(r.action).toBe("SHOW_MENU");
  });

  it("re-prompts when agendamento data is too short", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_AGENDAMENTO")
    );

    const r = await useCase.execute(jid, "Maria");

    expect(r.action).toBe("ASK_AGENDAMENTO");
    expect(mockRequests.registerRequest).not.toHaveBeenCalled();
  });

  it("unknown session status resets to menu", async () => {
    mockSession.lookupSession.mockResolvedValue({
      session: {
        remoteJid: jid,
        status: "INVALID" as "AGUARDANDO_OPCAO",
        updatedAt: new Date(),
      },
      expiredByInactivity: false,
    });

    const r = await useCase.execute(jid, "oi");

    expect(mockSession.openMenuSession).toHaveBeenCalledWith(jid);
    expect(r.action).toBe("SHOW_MENU");
  });

  it("non-AppError returns generic message", async () => {
    mockSession.lookupSession.mockResolvedValue(lookupWithSession("AGUARDANDO_CPF"));
    mockDebts.execute.mockRejectedValue(new Error("db down"));

    const r = await useCase.execute(jid, "12345678901");

    expect(r.text).toContain("Não foi possível concluir");
  });

  it("accepts menu option with surrounding spaces", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_OPCAO")
    );

    const r = await useCase.execute(jid, "  2  ");

    expect(r.action).toBe("ASK_CPF");
  });

  it("keeps ASK_OS when O.S. text is empty", async () => {
    mockSession.lookupSession.mockResolvedValue(lookupWithSession("AGUARDANDO_OS"));

    const r = await useCase.execute(jid, "   ");

    expect(r.action).toBe("ASK_OS");
    expect(mockOrder.execute).not.toHaveBeenCalled();
  });

  it("returns fallback when session lookup throws", async () => {
    mockSession.lookupSession.mockRejectedValue(new Error("mongo down"));

    const r = await useCase.execute(jid, "1");

    expect(r.action).toBe("SEND_MESSAGE");
    expect(r.text).toContain("Não foi possível processar");
  });

  it("normalizes remoteJid whitespace before session lookup", async () => {
    mockSession.lookupSession.mockResolvedValue(
      lookupWithSession("AGUARDANDO_OPCAO")
    );

    await useCase.execute(` ${jid} `, "1");

    expect(mockSession.setStatus).toHaveBeenCalledWith(jid, "AGUARDANDO_OS");
  });
});
