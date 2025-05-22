import { Counter } from "../schemas/CounterSchema";
import mongoose from "mongoose";

export class CounterService {
  /**
   * Obtém o próximo número da sequência para um contador específico
   * @param counterId ID do contador (ex: 'serviceOrder')
   * @param startValue Valor inicial caso seja o primeiro (padrão: 300000)
   * @returns Promise com o próximo número da sequência
   */
  static async getNextSequence(
    counterId: string, 
    startValue: number = 300000
  ): Promise<number> {
    try {
      // Usar findOneAndUpdate com upsert para garantir atomicidade
      const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { sequence: 1 } },
        { 
          new: true, // Retorna o documento atualizado
          upsert: true, // Cria se não existir
          setDefaultsOnInsert: true // Aplica defaults na inserção
        }
      );

      return counter?.sequence || startValue;
    } catch (error) {
      console.error(`Erro ao obter próximo número de sequência para ${counterId}:`, error);
      throw new Error(`Falha ao gerar número de sequência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém o próximo número da sequência dentro de uma sessão (para transações)
   * @param counterId ID do contador
   * @param session Sessão do MongoDB para transações
   * @param startValue Valor inicial caso seja o primeiro
   * @returns Promise com o próximo número da sequência
   */
  static async getNextSequenceWithSession(
    counterId: string,
    session: mongoose.ClientSession,
    startValue: number = 300000
  ): Promise<number> {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { sequence: 1 } },
        { 
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          session // Usar a sessão para transações
        }
      );

      return counter?.sequence || startValue;
    } catch (error) {
      console.error(`Erro ao obter próximo número de sequência para ${counterId} com sessão:`, error);
      throw new Error(`Falha ao gerar número de sequência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém o valor atual do contador sem incrementar
   * @param counterId ID do contador
   * @returns Promise com o valor atual ou null se não existir
   */
  static async getCurrentSequence(counterId: string): Promise<number | null> {
    try {
      const counter = await Counter.findById(counterId);
      return counter?.sequence || null;
    } catch (error) {
      console.error(`Erro ao obter sequência atual para ${counterId}:`, error);
      return null;
    }
  }

  /**
   * Reseta um contador para um valor específico
   * @param counterId ID do contador
   * @param value Novo valor para o contador
   * @returns Promise<boolean> indicando sucesso
   */
  static async resetCounter(counterId: string, value: number): Promise<boolean> {
    try {
      await Counter.findOneAndUpdate(
        { _id: counterId },
        { sequence: value },
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error(`Erro ao resetar contador ${counterId}:`, error);
      return false;
    }
  }
}