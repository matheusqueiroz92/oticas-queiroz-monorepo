import { IBaseRepository } from "./IBaseRepository";
import type { IOrder, CreateOrderDTO } from "../../interfaces/IOrder";

/**
 * Interface específica para OrderRepository
 * Estende operações base com métodos especializados para pedidos
 */
export interface IOrderRepository extends IBaseRepository<IOrder, CreateOrderDTO> {
  /**
   * Busca pedidos por cliente
   * @param clientId ID do cliente
   * @param includeDeleted Incluir pedidos deletados
   * @returns Lista de pedidos do cliente
   */
  findByClientId(clientId: string, includeDeleted?: boolean): Promise<IOrder[]>;

  /**
   * Busca pedidos por funcionário
   * @param employeeId ID do funcionário
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pedidos do funcionário
   */
  findByEmployeeId(
    employeeId: string,
    page?: number,
    limit?: number
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }>;

  /**
   * Busca pedidos por número de O.S.
   * @param serviceOrder Número da O.S.
   * @param includeDeleted Incluir pedidos deletados
   * @returns Lista de pedidos
   */
  findByServiceOrder(serviceOrder: string, includeDeleted?: boolean): Promise<IOrder[]>;

  /**
   * Busca pedidos por status
   * @param status Status dos pedidos
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pedidos
   */
  findByStatus(
    status: IOrder["status"],
    page?: number,
    limit?: number
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }>;

  /**
   * Busca pedidos por laboratório
   * @param laboratoryId ID do laboratório
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pedidos
   */
  findByLaboratory(
    laboratoryId: string,
    page?: number,
    limit?: number
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }>;

  /**
   * Busca pedidos por intervalo de datas
   * @param startDate Data inicial
   * @param endDate Data final
   * @param includeDeleted Incluir pedidos deletados
   * @returns Lista de pedidos
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    includeDeleted?: boolean
  ): Promise<IOrder[]>;

  /**
   * Busca pedidos do dia
   * @param date Data para busca (padrão: hoje)
   * @returns Lista de pedidos do dia
   */
  findDailyOrders(date?: Date): Promise<IOrder[]>;

  /**
   * Busca pedidos por produto
   * @param productId ID do produto
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pedidos
   */
  findByProductId(
    productId: string,
    page?: number,
    limit?: number
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }>;

  /**
   * Atualiza status do pedido
   * @param id ID do pedido
   * @param status Novo status
   * @returns Pedido atualizado ou null
   */
  updateStatus(id: string, status: IOrder["status"]): Promise<IOrder | null>;

  /**
   * Atualiza laboratório do pedido
   * @param id ID do pedido
   * @param laboratoryId ID do laboratório
   * @returns Pedido atualizado ou null
   */
  updateLaboratory(id: string, laboratoryId: string): Promise<IOrder | null>;

  /**
   * Busca pedidos com status de pagamento específico
   * @param paymentStatus Status do pagamento
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pedidos
   */
  findByPaymentStatus(
    paymentStatus: IOrder["paymentStatus"],
    page?: number,
    limit?: number
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }>;

  /**
   * Busca pedidos deletados
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de pedidos deletados
   */
  findDeleted(
    page?: number,
    limit?: number
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }>;

  /**
   * Busca pedidos com filtros avançados
   * @param filters Filtros complexos
   * @param page Página
   * @param limit Limite por página
   * @param includeDeleted Incluir pedidos deletados
   * @returns Lista paginada de pedidos
   */
  findWithFilters(
    filters: Record<string, any>,
    page?: number,
    limit?: number,
    includeDeleted?: boolean
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }>;

  /**
   * Conta pedidos por status
   * @param startDate Data inicial (opcional)
   * @param endDate Data final (opcional)
   * @returns Contagem por status
   */
  countByStatus(
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<IOrder["status"], number>>;

  /**
   * Calcula receita por período
   * @param startDate Data inicial
   * @param endDate Data final
   * @returns Dados de receita
   */
  getRevenueSummary(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    totalDiscount: number;
    finalRevenue: number;
    orderCount: number;
  }>;
} 