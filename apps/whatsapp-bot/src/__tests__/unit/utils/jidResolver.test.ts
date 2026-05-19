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

  it("uses senderPn when remoteJid is LID", () => {
    const result = resolveOutboundJid(lid, { senderPn: phone });
    expect(result).toBe(phone);
    expect(getCachedPhoneJidForLid(lid)).toBe(phone);
  });

  it("normalizes senderPn without suffix", () => {
    const result = resolveOutboundJid(lid, { senderPn: "557788334370" });
    expect(result).toBe(phone);
  });

  it("uses cache when key has no Pn", () => {
    rememberLidPhoneMapping(lid, phone);
    expect(resolveOutboundJid(lid)).toBe(phone);
  });

  it("returns original jid when not LID and no mapping", () => {
    expect(resolveOutboundJid(phone)).toBe(phone);
  });
});
