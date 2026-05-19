import { describe, it, expect } from "@jest/globals";
import {
  isBackToMenuCommand,
  normalizeInboundText,
  normalizeRemoteJid,
  parseMenuOption,
} from "../../../utils/botInboundNormalize";
import { botWebhookBodySchema } from "../../../dto/bot/BotWebhookDtos";

describe("botInboundNormalize", () => {
  it("trims remoteJid", () => {
    expect(normalizeRemoteJid(" 5511@s.whatsapp.net \n")).toBe(
      "5511@s.whatsapp.net"
    );
  });

  it("coerces numeric text to string menu option", () => {
    expect(parseMenuOption("1")).toBe("1");
    expect(normalizeInboundText(1)).toBe("1");
  });

  it("parses only valid menu digits", () => {
    expect(parseMenuOption("5")).toBeNull();
    expect(parseMenuOption("opcao 1")).toBeNull();
  });

  it("detects back to menu command", () => {
    expect(isBackToMenuCommand("0")).toBe(true);
    expect(isBackToMenuCommand(" 0 ")).toBe(true);
    expect(isBackToMenuCommand("10")).toBe(false);
  });

  it("accepts nested n8n body wrapper", () => {
    const parsed = botWebhookBodySchema.parse({
      body: {
        remoteJid: "5511@s.whatsapp.net",
        text: 1,
      },
    });

    expect(parsed.remoteJid).toBe("5511@s.whatsapp.net");
    expect(parsed.text).toBe("1");
  });
});
