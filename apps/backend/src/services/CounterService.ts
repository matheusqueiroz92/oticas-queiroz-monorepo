import { RepositoryFactory } from "../repositories/RepositoryFactory";
import type { ICounterRepository } from "../repositories/interfaces/ICounterRepository";
import mongoose from "mongoose";

export class CounterService {
  private counterRepository: ICounterRepository;

  constructor() {
    this.counterRepository = RepositoryFactory.getInstance().getCounterRepository();
  }

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
    const service = new CounterService();
    return service.counterRepository.getNextSequence(counterId, startValue);
  }

  /**
   * Obtém o próximo número da sequência dentro de uma sessão (para transações)
   */
  static async getNextSequenceWithSession(
    counterId: string,
    session: mongoose.ClientSession,
    startValue: number = 300000
  ): Promise<number> {
    const service = new CounterService();
    return service.counterRepository.getNextSequenceWithSession(counterId, session, startValue);
  }

  /**
   * Obtém o valor atual do contador sem incrementar
   * @param counterId ID do contador
   * @returns Promise com o valor atual ou null se não existir
   */
  static async getCurrentSequence(counterId: string): Promise<number | null> {
    const service = new CounterService();
    return service.counterRepository.getCurrentSequence(counterId);
  }

  /**
   * Reseta um contador para um valor específico
   * @param counterId ID do contador
   * @param value Novo valor para o contador
   * @returns Promise<boolean> indicando sucesso
   */
  static async resetCounter(counterId: string, value: number): Promise<boolean> {
    const service = new CounterService();
    return service.counterRepository.resetCounter(counterId, value);
  }

  // Novos métodos usando funcionalidades do repository
  /**
   * Cria um novo contador
   * @param counterId ID do contador
   * @param initialValue Valor inicial
   * @returns Promise com o counter criado
   */
  static async createCounter(counterId: string, initialValue: number = 300000) {
    const service = new CounterService();
    return service.counterRepository.createCounter(counterId, initialValue);
  }

  /**
   * Verifica se um contador existe
   * @param counterId ID do contador
   * @returns Promise<boolean> indicando se existe
   */
  static async exists(counterId: string): Promise<boolean> {
    const service = new CounterService();
    return service.counterRepository.exists(counterId);
  }

  /**
   * Lista todos os contadores
   * @returns Promise com array de contadores
   */
  static async findAll() {
    const service = new CounterService();
    return service.counterRepository.findAll();
  }

  /**
   * Remove um contador
   * @param counterId ID do contador
   * @returns Promise<boolean> indicando sucesso
   */
  static async deleteCounter(counterId: string): Promise<boolean> {
    const service = new CounterService();
    return service.counterRepository.deleteCounter(counterId);
  }

  // Métodos de instância para uso em outros serviços
  /**
   * Obtém próxima sequência (método de instância)
   */
  async getNextSequenceInstance(counterId: string, startValue: number = 300000): Promise<number> {
    return this.counterRepository.getNextSequence(counterId, startValue);
  }

  /**
   * Obtém próxima sequência com sessão (método de instância)
   */
  async getNextSequenceWithSessionInstance(
    counterId: string,
    session: mongoose.ClientSession,
    startValue: number = 300000
  ): Promise<number> {
    return this.counterRepository.getNextSequenceWithSession(counterId, session, startValue);
  }

  /**
   * Obtém valor atual (método de instância)
   */
  async getCurrentSequenceInstance(counterId: string): Promise<number | null> {
    return this.counterRepository.getCurrentSequence(counterId);
  }
}