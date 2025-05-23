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
      // Verificar se o contador existe
      let counter = await Counter.findById(counterId);
      
      if (!counter) {
        // Se não existe, criar com o valor inicial
        console.log(`Criando novo contador ${counterId} com valor inicial ${startValue}`);
        counter = new Counter({
          _id: counterId,
          sequence: startValue
        });
        await counter.save();
        return startValue;
      }
      
      // Se existe, incrementar
      const result = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { sequence: 1 } },
        { 
          new: true, // Retorna o documento atualizado
          runValidators: true
        }
      );

      return result?.sequence || startValue;
    } catch (error) {
      console.error(`Erro ao obter próximo número de sequência para ${counterId}:`, error);
      throw new Error(`Falha ao gerar número de sequência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém o próximo número da sequência dentro de uma sessão (para transações)
   */
  static async getNextSequenceWithSession(
    counterId: string,
    session: mongoose.ClientSession,
    startValue: number = 300000
  ): Promise<number> {
    try {
      // Verificar se o contador existe
      let counter = await Counter.findById(counterId).session(session);
      
      if (!counter) {
        // Se não existe, criar com o valor inicial
        console.log(`Criando novo contador ${counterId} com valor inicial ${startValue} (com sessão)`);
        counter = new Counter({
          _id: counterId,
          sequence: startValue
        });
        await counter.save({ session });
        return startValue;
      }
      
      // Se existe, incrementar
      const result = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { sequence: 1 } },
        { 
          new: true,
          runValidators: true,
          session
        }
      );

      return result?.sequence || startValue;
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
      if (!counter) {
        console.log(`Contador ${counterId} não existe`);
        return null;
      }
      
      console.log(`Valor atual do contador ${counterId}:`, counter.sequence);
      return counter.sequence;
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
      console.log(`Resetando contador ${counterId} para valor ${value}`);
      
      await Counter.findOneAndUpdate(
        { _id: counterId },
        { sequence: value },
        { upsert: true, runValidators: true }
      );
      
      console.log(`Contador ${counterId} resetado com sucesso para ${value}`);
      return true;
    } catch (error) {
      console.error(`Erro ao resetar contador ${counterId}:`, error);
      return false;
    }
  }
}