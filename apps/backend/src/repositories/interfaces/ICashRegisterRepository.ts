import { IBaseRepository } from "./IBaseRepository";
import type { ICashRegister } from "../../interfaces/ICashRegister";

/**
 * Interface específica para CashRegisterRepository
 * Estende operações base com métodos especializados para caixas registradoras
 */
export interface ICashRegisterRepository extends IBaseRepository<ICashRegister, Omit<ICashRegister, '_id'>> {
  /**
   * Busca caixa registradora aberta
   * @returns Caixa aberta ou null
   */
  findOpenRegister(): Promise<ICashRegister | null>;

  /**
   * Busca caixas por status
   * @param status Status do caixa
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de caixas
   */
  findByStatus(
    status: "open" | "closed",
    page?: number,
    limit?: number
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }>;

  /**
   * Busca caixas por data de abertura
   * @param startDate Data inicial
   * @param endDate Data final
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de caixas
   */
  findByOpeningDate(
    startDate: Date,
    endDate: Date,
    page?: number,
    limit?: number
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }>;

  /**
   * Busca caixas por usuário que abriu
   * @param openedBy ID do usuário
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de caixas
   */
  findByOpenedBy(
    openedBy: string,
    page?: number,
    limit?: number
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }>;

  /**
   * Busca caixas por usuário que fechou
   * @param closedBy ID do usuário
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de caixas
   */
  findByClosedBy(
    closedBy: string,
    page?: number,
    limit?: number
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }>;

  /**
   * Fecha um caixa registradora
   * @param id ID do caixa
   * @param closingData Dados de fechamento
   * @returns Caixa fechada ou null
   */
  closeRegister(
    id: string,
    closingData: {
      closingBalance: number;
      closedBy: string;
      observations?: string;
    }
  ): Promise<ICashRegister | null>;

  /**
   * Atualiza saldo atual do caixa
   * @param id ID do caixa
   * @param amount Valor a ser adicionado/removido
   * @param operation Tipo de operação
   * @returns Caixa atualizada ou null
   */
  updateBalance(
    id: string,
    amount: number,
    operation: "add" | "subtract"
  ): Promise<ICashRegister | null>;

  /**
   * Atualiza valores de vendas
   * @param id ID do caixa
   * @param salesData Dados de vendas
   * @returns Caixa atualizada ou null
   */
  updateSales(
    id: string,
    salesData: Partial<ICashRegister["sales"]>
  ): Promise<ICashRegister | null>;

  /**
   * Atualiza valores de pagamentos
   * @param id ID do caixa
   * @param paymentsData Dados de pagamentos
   * @returns Caixa atualizada ou null
   */
  updatePayments(
    id: string,
    paymentsData: Partial<ICashRegister["payments"]>
  ): Promise<ICashRegister | null>;

  /**
   * Busca resumo diário
   * @param date Data específica
   * @returns Resumo do dia ou null
   */
  findDailySummary(date: Date): Promise<{
    openingBalance: number;
    currentBalance: number;
    totalSales: number;
    totalPaymentsReceived: number;
    salesByMethod: Record<string, number>;
  } | null>;

  /**
   * Busca caixas com diferença
   * @param minDifference Diferença mínima
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de caixas com diferença
   */
  findWithDifference(
    minDifference: number,
    page?: number,
    limit?: number
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }>;

  /**
   * Busca estatísticas de caixas
   * @param startDate Data inicial
   * @param endDate Data final
   * @returns Estatísticas dos caixas
   */
  getStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRegisters: number;
    totalSales: number;
    totalDifference: number;
    averageBalance: number;
    registersByStatus: Record<string, number>;
  }>;
} 