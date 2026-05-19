export const BOT_CHAT_SESSION_STATUSES = [
  "AGUARDANDO_OPCAO",
  "AGUARDANDO_OS",
  "AGUARDANDO_CPF",
  "AGUARDANDO_AGENDAMENTO",
  "AGUARDANDO_ORCAMENTO",
] as const;

export type BotChatSessionStatus = (typeof BOT_CHAT_SESSION_STATUSES)[number];

export interface IBotChatSession {
  _id?: string;
  remoteJid: string;
  status: BotChatSessionStatus;
  updatedAt: Date;
  createdAt?: Date;
}

export interface BotSessionLookup {
  session: IBotChatSession | null;
  expiredByInactivity: boolean;
}
