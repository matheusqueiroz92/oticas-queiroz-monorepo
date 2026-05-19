import axios from "axios";
import { forwardInbound } from "../../../services/n8nService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../../config/env", () => ({
  env: {
    N8N_WEBHOOK_URL: "http://localhost:5678/webhook/test",
    N8N_WEBHOOK_TIMEOUT_MS: 5000,
  },
}));

describe("n8nService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.post.mockResolvedValue({ status: 200, data: {} });
  });

  it("POSTs inbound payload to N8N_WEBHOOK_URL", async () => {
    const payload = {
      remoteJid: "5511999999999@s.whatsapp.net",
      pushName: "João",
      text: "Olá",
      timestamp: 1_700_000_000,
    };

    const result = await forwardInbound(payload);

    expect(result).toEqual({});
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://localhost:5678/webhook/test",
      payload,
      {
        timeout: 5000,
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  it("returns response body when n8n sends text", async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { text: "Olá! Como posso ajudar?" },
    });

    const result = await forwardInbound({
      remoteJid: "5511999999999@s.whatsapp.net",
      pushName: "João",
      text: "Oi",
      timestamp: 1_700_000_000,
    });

    expect(result).toEqual({ text: "Olá! Como posso ajudar?" });
  });
});
