/**
 * Interface para Counter (sistema de sequências)
 */
export interface ICounter {
  _id: string; // counterId
  sequence: number;
}

/**
 * Interface específica para CounterRepository
 * Sistema de contadores para gerar sequências numéricas
 */
export interface ICounterRepository {
  /**
   * Obtém o próximo número da sequência
   * @param counterId ID do contador
   * @param startValue Valor inicial se não existir
   * @returns Próximo número da sequência
   */
  getNextSequence(counterId: string, startValue?: number): Promise<number>;

  /**
   * Obtém o próximo número da sequência com sessão (para transações)
   * @param counterId ID do contador
   * @param session Sessão MongoDB
   * @param startValue Valor inicial se não existir
   * @returns Próximo número da sequência
   */
  getNextSequenceWithSession(
    counterId: string,
    session: any, // mongoose.ClientSession
    startValue?: number
  ): Promise<number>;

  /**
   * Obtém o valor atual do contador sem incrementar
   * @param counterId ID do contador
   * @returns Valor atual ou null se não existir
   */
  getCurrentSequence(counterId: string): Promise<number | null>;

  /**
   * Reseta um contador para um valor específico
   * @param counterId ID do contador
   * @param value Novo valor
   * @returns true se sucesso
   */
  resetCounter(counterId: string, value: number): Promise<boolean>;

  /**
   * Cria um novo contador
   * @param counterId ID do contador
   * @param initialValue Valor inicial
   * @returns Counter criado
   */
  createCounter(counterId: string, initialValue: number): Promise<ICounter>;

  /**
   * Verifica se um contador existe
   * @param counterId ID do contador
   * @returns true se existe
   */
  exists(counterId: string): Promise<boolean>;

  /**
   * Lista todos os contadores
   * @returns Lista de contadores
   */
  findAll(): Promise<ICounter[]>;

  /**
   * Remove um contador
   * @param counterId ID do contador
   * @returns true se removido
   */
  deleteCounter(counterId: string): Promise<boolean>;
} 