import {
  extractTextFromMessage,
  isGroupJid,
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
