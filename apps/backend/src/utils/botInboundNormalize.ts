import { BOT_CHAT_SESSION_STATUSES } from "../interfaces/IBotChatSession";
import type { BotChatSessionStatus } from "../interfaces/IBotChatSession";

export function normalizeRemoteJid(remoteJid: unknown): string {
  return String(remoteJid ?? "").trim();
}

const MAX_INBOUND_TEXT_LENGTH = 2000;

export function normalizeInboundText(text: unknown): string {
  const normalized = String(text ?? "").trim();
  // Trunca silenciosamente antes da validação Zod para evitar payloads gigantes
  return normalized.length > MAX_INBOUND_TEXT_LENGTH
    ? normalized.slice(0, MAX_INBOUND_TEXT_LENGTH)
    : normalized;
}

export type MenuOption = "1" | "2" | "3" | "4";

export function parseMenuOption(text: string): MenuOption | null {
  const normalized = normalizeInboundText(text);
  if (normalized === "1" || normalized === "2" || normalized === "3" || normalized === "4") {
    return normalized;
  }
  return null;
}

export function isBackToMenuCommand(text: string): boolean {
  return normalizeInboundText(text) === "0";
}

export function isBotChatSessionStatus(value: string): value is BotChatSessionStatus {
  return (BOT_CHAT_SESSION_STATUSES as readonly string[]).includes(value);
}
