export interface InboundMessagePayload {
  remoteJid: string;
  pushName: string;
  text: string;
  timestamp: number;
}

/** Resposta opcional do n8n (ex.: nó Respond to Webhook com `{ "text": "..." }`). */
export interface N8nWebhookResponse {
  text?: string;
}

export interface SendMessageRequest {
  remoteJid: string;
  text: string;
}

export interface SendMessageResponse {
  success: true;
}

export interface ErrorResponse {
  status: "error";
  message: string;
}
