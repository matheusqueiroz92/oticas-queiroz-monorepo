import { Counter } from "../../schemas/CounterSchema";
import type { ICounter, ICounterRepository } from "../interfaces/ICounterRepository";
import mongoose from "mongoose";

/**
 * Implementação MongoDB do CounterRepository
 * Fornece acesso a contadores para geração de sequências numéricas
 */
export class MongoCounterRepository implements ICounterRepository {

  /**
   * Obtém o próximo número da sequência
   */
  async getNextSequence(counterId: string, startValue: number = 300000): Promise<number> {
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
   * Obtém o próximo número da sequência com sessão (para transações)
   */
  async getNextSequenceWithSession(
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
   */
  async getCurrentSequence(counterId: string): Promise<number | null> {
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
   */
  async resetCounter(counterId: string, value: number): Promise<boolean> {
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

  /**
   * Cria um novo contador
   */
  async createCounter(counterId: string, initialValue: number): Promise<ICounter> {
    try {
      const counter = new Counter({
        _id: counterId,
        sequence: initialValue
      });

      const savedCounter = await counter.save();
      
      return {
        _id: savedCounter._id,
        sequence: savedCounter.sequence
      };
    } catch (error) {
      console.error(`Erro ao criar contador ${counterId}:`, error);
      throw error;
    }
  }

  /**
   * Verifica se um contador existe
   */
  async exists(counterId: string): Promise<boolean> {
    try {
      const count = await Counter.countDocuments({ _id: counterId });
      return count > 0;
    } catch (error) {
      console.error(`Erro ao verificar existência do contador ${counterId}:`, error);
      return false;
    }
  }

  /**
   * Lista todos os contadores
   */
  async findAll(): Promise<ICounter[]> {
    try {
      const counters = await Counter.find({}).exec();
      
      return counters.map(counter => ({
        _id: counter._id,
        sequence: counter.sequence
      }));
    } catch (error) {
      console.error('Erro ao listar contadores:', error);
      return [];
    }
  }

  /**
   * Remove um contador
   */
  async deleteCounter(counterId: string): Promise<boolean> {
    try {
      const result = await Counter.findByIdAndDelete(counterId);
      
      if (result) {
        console.log(`Contador ${counterId} removido com sucesso`);
        return true;
      }
      
      console.log(`Contador ${counterId} não encontrado para remoção`);
      return false;
    } catch (error) {
      console.error(`Erro ao remover contador ${counterId}:`, error);
      return false;
    }
  }
} 