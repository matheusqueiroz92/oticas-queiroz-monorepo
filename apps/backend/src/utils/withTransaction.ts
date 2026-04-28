import mongoose from "mongoose";
import { logger } from "../config/logger";

/**
 * Executa uma operação dentro de uma transação MongoDB.
 *
 * Requer que o MongoDB esteja configurado com replica set (ex: Atlas).
 * Em ambientes sem replica set (standalone dev), loga um aviso e executa sem transação —
 * configure um replica set local ou use Atlas em produção para garantir atomicidade.
 */
export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  let session: mongoose.ClientSession | null = null;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const result = await operation(session);

    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session) {
      await session.abortTransaction().catch((abortError) => {
        logger.error("Erro ao abortar transação MongoDB", { abortError });
      });
    }

    // MongoDB standalone não suporta transações (códigos 51 e 20)
    // Executa sem transação com aviso — apenas aceitável em ambiente de desenvolvimento
    if (isTransactionUnsupportedError(error)) {
      logger.warn(
        "MongoDB não suporta transações (replica set não configurado). " +
        "Configure um replica set em produção para garantir atomicidade financeira."
      );
      return operation(createNoOpSession());
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession().catch(() => { /* ignorar erro de cleanup */ });
    }
  }
}

function isTransactionUnsupportedError(error: unknown): boolean {
  if (error instanceof Error && "code" in error) {
    const code = (error as any).code;
    // 51: Transaction numbers are only allowed on a replica member
    // 20: IllegalOperation (standalone)
    return code === 51 || code === 20;
  }
  return false;
}

/**
 * Sessão nula que mantém a assinatura mas não participa de transação.
 * Usado apenas como fallback de compatibilidade em ambientes sem replica set.
 */
function createNoOpSession(): mongoose.ClientSession {
  return null as unknown as mongoose.ClientSession;
}
