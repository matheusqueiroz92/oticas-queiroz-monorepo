import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BotInactivityMonitorService } from "../../../services/BotInactivityMonitorService";
import type { BotChatSessionService } from "../../../services/BotChatSessionService";
import type { WhatsAppGatewayClient } from "../../../services/WhatsAppGatewayClient";
import {
  buildConversationClosedText,
  buildInactivityWarningText,
} from "../../../constants/botChatMessages";

const jid = "5511999999999@s.whatsapp.net";

describe("BotInactivityMonitorService", () => {
  let service: BotInactivityMonitorService;
  let mockSession: jest.Mocked<
    Pick<
      BotChatSessionService,
      | "findSessionsForInactivityWarning"
      | "findSessionsForInactivityClose"
      | "markInactivityWarningSent"
      | "closeSession"
    >
  >;
  let mockGateway: jest.Mocked<Pick<WhatsAppGatewayClient, "sendText">>;

  const session = {
    remoteJid: jid,
    status: "AGUARDANDO_OPCAO" as const,
    awaitingResponseSince: new Date(Date.now() - 15 * 60 * 1000),
    inactivityWarningSentAt: null,
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockSession = {
      findSessionsForInactivityWarning: jest.fn(),
      findSessionsForInactivityClose: jest.fn(),
      markInactivityWarningSent: jest.fn(),
      closeSession: jest.fn(),
    };
    mockGateway = {
      sendText: jest.fn(),
    };

    mockSession.findSessionsForInactivityWarning.mockResolvedValue([]);
    mockSession.findSessionsForInactivityClose.mockResolvedValue([]);
    mockGateway.sendText.mockResolvedValue({ success: true });

    service = new BotInactivityMonitorService(
      mockSession as unknown as BotChatSessionService,
      mockGateway as unknown as WhatsAppGatewayClient
    );
  });

  it("sends warning and marks session when inactivity threshold exceeded", async () => {
    mockSession.findSessionsForInactivityWarning.mockResolvedValue([session]);

    await service.runCycle();

    expect(mockGateway.sendText).toHaveBeenCalledWith(
      jid,
      buildInactivityWarningText()
    );
    expect(mockSession.markInactivityWarningSent).toHaveBeenCalledWith(jid);
    expect(mockSession.closeSession).not.toHaveBeenCalled();
  });

  it("does not mark warning when gateway fails", async () => {
    mockSession.findSessionsForInactivityWarning.mockResolvedValue([session]);
    mockGateway.sendText.mockResolvedValue({ success: false });

    await service.runCycle();

    expect(mockSession.markInactivityWarningSent).not.toHaveBeenCalled();
  });

  it("closes session after warning timeout", async () => {
    const warnedSession = {
      ...session,
      inactivityWarningSentAt: new Date(Date.now() - 10 * 60 * 1000),
    };
    mockSession.findSessionsForInactivityClose.mockResolvedValue([warnedSession]);

    await service.runCycle();

    expect(mockGateway.sendText).toHaveBeenCalledWith(
      jid,
      buildConversationClosedText()
    );
    expect(mockSession.closeSession).toHaveBeenCalledWith(jid);
  });

  it("does not close session when closure message fails to send", async () => {
    const warnedSession = {
      ...session,
      inactivityWarningSentAt: new Date(Date.now() - 10 * 60 * 1000),
    };
    mockSession.findSessionsForInactivityClose.mockResolvedValue([warnedSession]);
    mockGateway.sendText.mockResolvedValue({ success: false });

    await service.runCycle();

    expect(mockSession.closeSession).not.toHaveBeenCalled();
  });
});
