import request from "supertest";
import { createApp } from "../../../server/http";

jest.mock("../../../connection/whatsapp", () => ({
  isWhatsAppConnected: jest.fn(),
  getWhatsAppSocket: jest.fn(),
}));

import {
  isWhatsAppConnected,
  getWhatsAppSocket,
} from "../../../connection/whatsapp";

const mockedConnected = isWhatsAppConnected as jest.MockedFunction<
  typeof isWhatsAppConnected
>;
const mockedGetSocket = getWhatsAppSocket as jest.MockedFunction<
  typeof getWhatsAppSocket
>;

describe("POST /send-message", () => {
  const apiKey = "test-bot-api-key";

  beforeEach(() => {
    process.env.BOT_API_KEY = apiKey;
    jest.clearAllMocks();
    mockedConnected.mockReturnValue(true);
    mockedGetSocket.mockReturnValue({
      sendMessage: jest.fn().mockResolvedValue({}),
    } as never);
  });

  it("returns 401 without x-api-key", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/send-message")
      .send({ remoteJid: "5511999999999@s.whatsapp.net", text: "Oi" });

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/send-message")
      .set("x-api-key", apiKey)
      .send({ remoteJid: "", text: "" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });

  it("returns 503 when WhatsApp disconnected", async () => {
    mockedConnected.mockReturnValue(false);
    const app = createApp();
    const res = await request(app)
      .post("/send-message")
      .set("x-api-key", apiKey)
      .send({
        remoteJid: "5511999999999@s.whatsapp.net",
        text: "Resposta",
      });

    expect(res.status).toBe(503);
  });

  it("returns 200 and sends message when connected", async () => {
    const sendMessage = jest.fn().mockResolvedValue({});
    mockedGetSocket.mockReturnValue({ sendMessage } as never);

    const app = createApp();
    const res = await request(app)
      .post("/send-message")
      .set("x-api-key", apiKey)
      .send({
        remoteJid: "5511999999999@s.whatsapp.net",
        text: "Resposta",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(sendMessage).toHaveBeenCalledWith(
      "5511999999999@s.whatsapp.net",
      { text: "Resposta" }
    );
  });
});
