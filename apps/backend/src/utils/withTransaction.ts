import mongoose from "mongoose";
import { logger } from "../config/logger";

// Cached após a primeira detecção: evita tentar transação novamente em standalone
let standaloneMode = false;

/**
 * Executa uma operação dentro de uma transação MongoDB.
 *
 * Requer que o MongoDB esteja configurado com replica set (ex: Atlas).
 * Em ambientes sem replica set (standalone), detecta na primeira tentativa e
 * executa sem sessão em todas as chamadas subsequentes, evitando re-tentativas
 * que poderiam causar double-writes.
 */
export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  if (standaloneMode) {
    return operation(null as unknown as mongoose.ClientSession);
  }

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

    // MongoDB standalone não suporta transações (códigos 51 e 20).
    // Na primeira detecção, marca standaloneMode para evitar novas tentativas.
    if (isTransactionUnsupportedError(error)) {
      standaloneMode = true;
      logger.warn(
        "MongoDB standalone detectado — transações desabilitadas. " +
        "Configure um replica set em produção para garantir atomicidade financeira."
      );
      return operation(null as unknown as mongoose.ClientSession);
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession().catch(() => {});
    }
  }
}

/** Exposta apenas para reset em testes de unidade. */
export function resetTransactionMode(): void {
  standaloneMode = false;
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
