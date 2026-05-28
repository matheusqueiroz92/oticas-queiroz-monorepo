import {
  clearLidPhoneCache,
  getCachedPhoneJidForLid,
  rememberLidPhoneMapping,
  resolveOutboundJid,
} from "../../../utils/jidResolver";

describe("jidResolver", () => {
  const lid = "258690393337861@lid";
  const phone = "557788334370@s.whatsapp.net";

  beforeEach(() => {
    clearLidPhoneCache();
  });

  it("replies on LID when inbound is LID (keeps phone in cache only)", () => {
    const result = resolveOutboundJid(lid, { senderPn: phone });
    expect(result).toBe(lid);
    expect(getCachedPhoneJidForLid(lid)).toBe(phone);
  });

  it("normalizes senderPn into cache without changing LID destination", () => {
    const result = resolveOutboundJid(lid, { senderPn: "557788334370" });
    expect(result).toBe(lid);
    expect(getCachedPhoneJidForLid(lid)).toBe(phone);
  });

  it("returns LID when key has no Pn but cache exists", () => {
    rememberLidPhoneMapping(lid, phone);
    expect(resolveOutboundJid(lid)).toBe(lid);
  });

  it("returns original jid when not LID and no mapping", () => {
    expect(resolveOutboundJid(phone)).toBe(phone);
  });
});
