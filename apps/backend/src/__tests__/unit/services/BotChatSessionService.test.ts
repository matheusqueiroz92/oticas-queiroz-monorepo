import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BotChatSessionService } from "../../../services/BotChatSessionService";
import type { BotChatSessionModel } from "../../../models/BotChatSessionModel";

describe("BotChatSessionService", () => {
  let service: BotChatSessionService;
  let mockModel: jest.Mocked<
    Pick<
      BotChatSessionModel,
      | "findByRemoteJid"
      | "upsert"
      | "deleteByRemoteJid"
      | "markAwaitingResponse"
      | "recordUserActivity"
      | "markInactivityWarningSent"
      | "findSessionsForInactivityWarning"
      | "findSessionsForInactivityClose"
    >
  >;

  const jid = "5511999999999@s.whatsapp.net";
  const now = new Date();
  const session = {
    _id: "s1",
    remoteJid: jid,
    status: "AGUARDANDO_OPCAO" as const,
    awaitingResponseSince: now,
    inactivityWarningSentAt: null,
    updatedAt: now,
  };

  beforeEach(() => {
    mockModel = {
      findByRemoteJid: jest.fn(),
      upsert: jest.fn(),
      deleteByRemoteJid: jest.fn(),
      markAwaitingResponse: jest.fn(),
      recordUserActivity: jest.fn(),
      markInactivityWarningSent: jest.fn(),
      findSessionsForInactivityWarning: jest.fn(),
      findSessionsForInactivityClose: jest.fn(),
    };
    service = new BotChatSessionService(
      mockModel as unknown as BotChatSessionModel
    );
  });

  it("returns none when session does not exist", async () => {
    mockModel.findByRemoteJid.mockResolvedValue(null);
    await expect(service.lookupSession(jid)).resolves.toEqual({
      session: null,
      expiredByInactivity: false,
    });
  });

  it("deletes and flags inactivity when session expired", async () => {
    const expired = {
      ...session,
      updatedAt: new Date(Date.now() - 60 * 60 * 1000),
    };
    mockModel.findByRemoteJid.mockResolvedValue(expired);

    await expect(service.lookupSession(jid)).resolves.toEqual({
      session: null,
      expiredByInactivity: true,
    });
    expect(mockModel.deleteByRemoteJid).toHaveBeenCalledWith(jid);
  });

  it("returns active session", async () => {
    mockModel.findByRemoteJid.mockResolvedValue(session);
    await expect(service.lookupSession(jid)).resolves.toEqual({
      session,
      expiredByInactivity: false,
    });
  });

  it("upserts menu session", async () => {
    mockModel.upsert.mockResolvedValue(session);
    await expect(service.openMenuSession(jid)).resolves.toEqual(session);
    expect(mockModel.upsert).toHaveBeenCalledWith(jid, "AGUARDANDO_OPCAO");
  });

  it("closes session", async () => {
    await service.closeSession(jid);
    expect(mockModel.deleteByRemoteJid).toHaveBeenCalledWith(jid);
  });

  it("marks awaiting response", async () => {
    mockModel.markAwaitingResponse.mockResolvedValue(session);
    await service.markAwaitingResponse(jid);
    expect(mockModel.markAwaitingResponse).toHaveBeenCalledWith(jid);
  });

  it("records user activity", async () => {
    mockModel.recordUserActivity.mockResolvedValue(session);
    await service.recordUserActivity(jid);
    expect(mockModel.recordUserActivity).toHaveBeenCalledWith(jid);
  });

  it("marks inactivity warning sent", async () => {
    mockModel.markInactivityWarningSent.mockResolvedValue({
      ...session,
      inactivityWarningSentAt: new Date(),
    });
    await service.markInactivityWarningSent(jid);
    expect(mockModel.markInactivityWarningSent).toHaveBeenCalledWith(jid);
  });

  it("finds sessions for inactivity warning", async () => {
    const threshold = new Date(Date.now() - 10 * 60 * 1000);
    mockModel.findSessionsForInactivityWarning.mockResolvedValue([session]);

    const result = await service.findSessionsForInactivityWarning(threshold);

    expect(mockModel.findSessionsForInactivityWarning).toHaveBeenCalledWith(
      threshold
    );
    expect(result).toEqual([session]);
  });

  it("finds sessions for inactivity close", async () => {
    const threshold = new Date(Date.now() - 5 * 60 * 1000);
    const warned = { ...session, inactivityWarningSentAt: new Date() };
    mockModel.findSessionsForInactivityClose.mockResolvedValue([warned]);

    const result = await service.findSessionsForInactivityClose(threshold);

    expect(mockModel.findSessionsForInactivityClose).toHaveBeenCalledWith(
      threshold
    );
    expect(result).toEqual([warned]);
  });
});
