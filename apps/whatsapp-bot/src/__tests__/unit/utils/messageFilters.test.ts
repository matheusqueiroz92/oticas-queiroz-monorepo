import {
  extractTextFromMessage,
  isGroupJid,
  isIgnorableInboundJid,
  isProcessableUserMessage,
  toUnixTimestampSeconds,
} from "../../../utils/messageFilters";

describe("messageFilters", () => {
  describe("isGroupJid", () => {
    it("returns true for group JID", () => {
      expect(isGroupJid("120363123456789012@g.us")).toBe(true);
    });

    it("returns false for individual JID", () => {
      expect(isGroupJid("5511999999999@s.whatsapp.net")).toBe(false);
    });

    it("returns false for empty", () => {
      expect(isGroupJid(null)).toBe(false);
    });
  });

  describe("isIgnorableInboundJid", () => {
    it("ignora status do WhatsApp", () => {
      expect(isIgnorableInboundJid("status@broadcast")).toBe(true);
    });

    it("ignora grupos e canais", () => {
      expect(isIgnorableInboundJid("120363123456789012@g.us")).toBe(true);
      expect(isIgnorableInboundJid("1234567890@newsletter")).toBe(true);
    });

    it("aceita conversa individual", () => {
      expect(isIgnorableInboundJid("5511999999999@s.whatsapp.net")).toBe(
        false
      );
      expect(isIgnorableInboundJid("258690393337861@lid")).toBe(false);
    });

    it("ignora JID vazio", () => {
      expect(isIgnorableInboundJid(null)).toBe(true);
    });
  });

  describe("isProcessableUserMessage", () => {
    it("aceita mensagem de texto comum", () => {
      expect(
        isProcessableUserMessage({
          key: {},
          message: { conversation: "Olá" },
        })
      ).toBe(true);
    });

    it("ignora status e mensagens de protocolo", () => {
      expect(
        isProcessableUserMessage({
          key: { remoteJid: "status@broadcast" },
          broadcast: true,
          message: { conversation: "Meu status" },
        })
      ).toBe(false);

      expect(
        isProcessableUserMessage({
          key: {},
          message: { protocolMessage: { type: 0 } },
        })
      ).toBe(false);

      expect(
        isProcessableUserMessage({
          key: {},
          messageStubType: 1,
          message: { conversation: "stub" },
        })
      ).toBe(false);
    });
  });

  describe("extractTextFromMessage", () => {
    it("extracts conversation text", () => {
      expect(
        extractTextFromMessage({ conversation: "Olá" })
      ).toBe("Olá");
    });

    it("extracts extended text", () => {
      expect(
        extractTextFromMessage({
          extendedTextMessage: { text: "Resposta longa" },
        })
      ).toBe("Resposta longa");
    });

    it("returns null for media without text", () => {
      expect(
        extractTextFromMessage({ imageMessage: {} })
      ).toBeNull();
    });
  });

  describe("toUnixTimestampSeconds", () => {
    it("converts milliseconds to seconds", () => {
      expect(toUnixTimestampSeconds(1_700_000_000_000)).toBe(1_700_000_000);
    });

    it("keeps seconds as-is", () => {
      expect(toUnixTimestampSeconds(1_700_000_000)).toBe(1_700_000_000);
    });

    it("uses current time when undefined", () => {
      const now = Math.floor(Date.now() / 1000);
      const result = toUnixTimestampSeconds(undefined);
      expect(result).toBeGreaterThanOrEqual(now - 2);
      expect(result).toBeLessThanOrEqual(now + 2);
    });
  });
});
