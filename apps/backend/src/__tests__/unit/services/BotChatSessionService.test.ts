import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BotChatSessionService } from "../../../services/BotChatSessionService";
import type { BotChatSessionModel } from "../../../models/BotChatSessionModel";

describe("BotChatSessionService", () => {
  let service: BotChatSessionService;
  let mockModel: jest.Mocked<
    Pick<BotChatSessionModel, "findByRemoteJid" | "upsert" | "deleteByRemoteJid">
  >;

  const jid = "5511999999999@s.whatsapp.net";
  const session = {
    _id: "s1",
    remoteJid: jid,
    status: "AGUARDANDO_OPCAO" as const,
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockModel = {
      findByRemoteJid: jest.fn(),
      upsert: jest.fn(),
      deleteByRemoteJid: jest.fn(),
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
});
