import axios from "axios";
import { processInboundMessage } from "../../../services/inboundMessageService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../../config/env", () => ({
  env: {
    BOT_CHAT_MODE: "n8n",
    BOT_ERP_FALLBACK_ON_N8N_ERROR: true,
    N8N_WEBHOOK_URL: "http://localhost:5678/webhook-test/test",
    N8N_WEBHOOK_TIMEOUT_MS: 5000,
    ERP_API_URL: "http://localhost:3333",
    BOT_API_KEY: "test-key",
  },
}));

const payload = {
  remoteJid: "258690393337861@lid",
  pushName: "Test",
  text: "1",
  timestamp: 1_700_000_000,
};

describe("processInboundMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses ERP when n8n returns 404", async () => {
    mockedAxios.post
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 },
        message: "Request failed with status code 404",
      })
      .mockResolvedValueOnce({
        data: {
          action: "ASK_OS",
          text: "Informe a O.S.",
          sessionStatus: "AGUARDANDO_OS",
        },
      });

    mockedAxios.isAxiosError.mockReturnValue(true);

    const result = await processInboundMessage(payload);

    expect(result).toEqual({ text: "Informe a O.S." });
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(mockedAxios.post).toHaveBeenLastCalledWith(
      "http://localhost:3333/api/bot/chat",
      { remoteJid: payload.remoteJid, text: "1" },
      expect.objectContaining({
        headers: expect.objectContaining({ "x-api-key": "test-key" }),
      })
    );
  });
});
