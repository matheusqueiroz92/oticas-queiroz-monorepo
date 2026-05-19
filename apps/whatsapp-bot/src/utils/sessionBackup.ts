import fs from "node:fs/promises";
import { logger } from "../config/logger";

/**
 * Copia o diretório de sessão Baileys para um diretório de backup adjacente.
 * Chamado a cada evento creds.update para manter o backup atualizado.
 *
 * Estrutura resultante:
 *   data/auth/        ← sessão ativa (volume bind-mount no Docker)
 *   data/auth-backup/ ← cópia de segurança mais recente
 */
export async function backupSession(sessionPath: string): Promise<void> {
  const backupPath = `${sessionPath}-backup`;

  try {
    await fs.cp(sessionPath, backupPath, { recursive: true, force: true });
    logger.debug("Backup da sessão WhatsApp realizado", { backupPath });
  } catch (err) {
    logger.warn("Falha ao fazer backup da sessão WhatsApp", {
      backupPath,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
