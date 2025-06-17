import { IBaseRepository } from "./IBaseRepository";
import type { IPayment } from "../../interfaces/IPayment";

/**
 * Interface específica para PaymentRepository
 * Estende operações base com métodos especializados para pagamentos
 */
export interface IPaymentRepository extends IBaseRepository<IPayment> {
  /**
   * Busca pagamentos por pedido
   * @param orderId ID do pedido
   * @returns Lista de pagamentos do pedido
   */
  findByOrderId(orderId: string): Promise<IPayment[]>;

  /**
   * Busca pagamentos por cliente
   * @param clientId ID do cliente
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pagamentos
   */
  findByClientId(
    clientId: string,
    page?: number,
    limit?: number
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }>;

  /**
   * Busca pagamentos por caixa
   * @param cashRegisterId ID do caixa
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pagamentos
   */
  findByCashRegisterId(
    cashRegisterId: string,
    page?: number,
    limit?: number
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }>;

  /**
   * Busca pagamentos por tipo
   * @param type Tipo do pagamento
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pagamentos
   */
  findByType(
    type: IPayment["type"],
    page?: number,
    limit?: number
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }>;

  /**
   * Busca pagamentos por método
   * @param paymentMethod Método de pagamento
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pagamentos
   */
  findByPaymentMethod(
    paymentMethod: IPayment["paymentMethod"],
    page?: number,
    limit?: number
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }>;

  /**
   * Busca pagamentos por status
   * @param status Status do pagamento
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pagamentos
   */
  findByStatus(
    status: IPayment["status"],
    page?: number,
    limit?: number
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }>;

  /**
   * Busca pagamentos por intervalo de datas
   * @param startDate Data inicial
   * @param endDate Data final
   * @returns Lista de pagamentos
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<IPayment[]>;

  /**
   * Busca cheques por status
   * @param status Status do cheque
   * @param startDate Data inicial (opcional)
   * @param endDate Data final (opcional)
   * @returns Lista de cheques
   */
  findChecksByStatus(
    status: "pending" | "compensated" | "rejected",
    startDate?: Date,
    endDate?: Date
  ): Promise<IPayment[]>;

  /**
   * Busca pagamentos diários
   * @param date Data para busca (padrão: hoje)
   * @param cashRegisterId ID do caixa (opcional)
   * @returns Lista de pagamentos do dia
   */
  findDailyPayments(date?: Date, cashRegisterId?: string): Promise<IPayment[]>;

  /**
   * Busca pagamentos com filtros do MongoDB
   * @param page Página
   * @param limit Limite por página
   * @param filters Filtros do MongoDB
   * @param populate Incluir dados relacionados
   * @returns Lista paginada de pagamentos
   */
  findWithMongoFilters(
    page: number,
    limit: number,
    filters: Record<string, any>,
    populate?: boolean
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }>;

  /**
   * Calcula total de pagamentos por período
   * @param startDate Data inicial
   * @param endDate Data final
   * @param type Tipo de pagamento (opcional)
   * @returns Total calculado
   */
  calculateTotalByPeriod(
    startDate: Date,
    endDate: Date,
    type?: IPayment["type"]
  ): Promise<number>;

  /**
   * Busca estatísticas de pagamentos por método
   * @param startDate Data inicial
   * @param endDate Data final
   * @returns Estatísticas por método de pagamento
   */
  getPaymentMethodStats(
    startDate: Date,
    endDate: Date
  ): Promise<Record<IPayment["paymentMethod"], { count: number; total: number }>>;

  /**
   * Busca pagamentos pendentes de um cliente
   * @param clientId ID do cliente
   * @returns Lista de pagamentos pendentes
   */
  findPendingByClientId(clientId: string): Promise<IPayment[]>;

  /**
   * Cancela um pagamento
   * @param id ID do pagamento
   * @param cancelledBy ID de quem cancelou
   * @param reason Motivo do cancelamento
   * @returns Pagamento cancelado ou null
   */
  cancel(id: string, cancelledBy: string, reason?: string): Promise<IPayment | null>;

  /**
   * Busca receita total por período e tipo
   * @param startDate Data inicial
   * @param endDate Data final
   * @returns Dados de receita agrupados
   */
  getRevenueSummary(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSales: number;
    totalDebtPayments: number;
    totalExpenses: number;
    dailyBalance: number;
    paymentsByMethod: Record<IPayment["paymentMethod"], number>;
  }>;
} 