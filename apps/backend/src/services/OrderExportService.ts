import { RepositoryFactory } from "../repositories/RepositoryFactory";
import { ExportUtils, type ExportOptions } from "../utils/exportUtils";
import type { IOrder } from "../interfaces/IOrder";
import type { IOrderRepository } from "../repositories/interfaces/IOrderRepository";

export class OrderExportService {
  private orderRepository: IOrderRepository;
  private exportUtils: ExportUtils;

  constructor() {
    const factory = RepositoryFactory.getInstance();
    this.orderRepository = factory.getOrderRepository();
    this.exportUtils = new ExportUtils();
  }

  /**
   * Exporta pedidos com filtros
   * @param options Opções de exportação
   * @param filters Filtros para busca
   * @returns Buffer do arquivo exportado
   */
  async exportOrders(
    options: ExportOptions,
    filters: Record<string, any> = {}
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Buscar todos os pedidos que atendem aos filtros
    const { items: orders } = await this.orderRepository.findAll(1, 10000, filters);

    // Gerar arquivo baseado no formato solicitado
    return await this.exportUtils.exportOrders(orders, options);
  }

  /**
   * Exporta resumo diário de pedidos
   * @param date Data para o resumo
   * @param options Opções de exportação
   * @returns Buffer do arquivo exportado
   */
  async exportDailySummary(
    date: Date,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Buscar pedidos do dia usando filtros existentes
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const filters = {
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    const { items: orders } = await this.orderRepository.findAll(1, 10000, filters);

    // Calcular estatísticas
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
    const finalRevenue = totalRevenue - totalDiscount;

    // Agrupar por status
    const statusGroups = orders.reduce((groups, order) => {
      const status = order.status;
      if (!groups[status]) {
        groups[status] = { count: 0, revenue: 0 };
      }
      groups[status].count++;
      groups[status].revenue += order.totalPrice - (order.discount || 0);
      return groups;
    }, {} as Record<string, { count: number; revenue: number }>);

    // Agrupar por método de pagamento
    const paymentGroups = orders.reduce((groups, order) => {
      const status = order.paymentStatus;
      if (!groups[status]) {
        groups[status] = { count: 0, revenue: 0 };
      }
      groups[status].count++;
      groups[status].revenue += order.totalPrice - (order.discount || 0);
      return groups;
    }, {} as Record<string, { count: number; revenue: number }>);

    // Criar estrutura do relatório
    const summary = {
      date: date.toLocaleDateString('pt-BR'),
      totalOrders,
      ordersByStatus: {
        pending: statusGroups['pending']?.count || 0,
        in_production: statusGroups['in_production']?.count || 0,
        ready: statusGroups['ready']?.count || 0,
        delivered: statusGroups['delivered']?.count || 0,
        cancelled: statusGroups['cancelled']?.count || 0
      },
      totalValue: totalRevenue,
      totalDiscount: totalDiscount,
      finalValue: finalRevenue,
      ordersByType: this.calculateOrdersByType(orders),
      orders
    };

    return await this.exportUtils.exportOrdersSummary(summary, options);
  }

  /**
   * Exporta detalhes de um pedido específico
   * @param orderId ID do pedido
   * @param options Opções de exportação
   * @returns Buffer do arquivo exportado
   */
  async exportOrderDetails(
    orderId: string,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    return await this.exportUtils.exportOrderDetails(order, options);
  }

  /**
   * Exporta pedidos por período
   * @param startDate Data de início
   * @param endDate Data de fim
   * @param options Opções de exportação
   * @returns Buffer do arquivo exportado
   */
  async exportOrdersByPeriod(
    startDate: Date,
    endDate: Date,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const filters = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const { items: orders } = await this.orderRepository.findAll(1, 10000, filters);

    return await this.exportUtils.exportOrders(orders, options);
  }

  /**
   * Calcula distribuição de pedidos por tipo de produto
   * @param orders Lista de pedidos
   * @returns Contagem por tipo
   */
  private calculateOrdersByType(orders: IOrder[]) {
    const types: Record<string, number> = {
      lenses: 0,
      clean_lenses: 0,
      prescription_frame: 0,
      sunglasses_frame: 0
    };

    orders.forEach(order => {
      order.products.forEach(product => {
        if (typeof product === 'object' && 'productType' in product) {
          const productType = (product as any).productType;
          if (types[productType] !== undefined) {
            types[productType]++;
          }
        }
      });
    });

    return types;
  }

  /**
   * Formata o status do pedido para exibição
   * @param status Status do pedido
   * @returns Status formatado
   */
  private formatOrderStatus(status: IOrder["status"]): string {
    const statuses: Record<IOrder["status"], string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
      cancelled: "Cancelado"
    };
    return statuses[status] || status;
  }

  /**
   * Formata o status do pagamento para exibição
   * @param status Status do pagamento
   * @returns Status formatado
   */
  private formatPaymentStatus(status: IOrder["paymentStatus"]): string {
    const statuses: Record<IOrder["paymentStatus"], string> = {
      pending: "Pendente",
      partially_paid: "Parcialmente Pago",
      paid: "Pago"
    };
    return statuses[status] || status;
  }

  /**
   * Agrupa pedidos por dia
   * @param orders Lista de pedidos
   * @returns Dados agrupados por dia
   */
  private groupOrdersByDay(orders: IOrder[]): Array<{
    data: string;
    totalPedidos: number;
    receitaTotal: string;
    receitaLiquida: string;
    totalDescontos: string;
    pedidosPendentes: number;
    pedidosEntregues: number;
  }> {
    const dailyGroups = orders.reduce((groups, order) => {
      const dateKey = new Date(order.createdAt!).toLocaleDateString('pt-BR');
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          count: 0,
          revenue: 0,
          discounts: 0,
          pending: 0,
          delivered: 0
        };
      }

      groups[dateKey].count++;
      groups[dateKey].revenue += order.totalPrice;
      groups[dateKey].discounts += order.discount || 0;
      
      if (order.status === 'pending') groups[dateKey].pending++;
      if (order.status === 'delivered') groups[dateKey].delivered++;
      
      return groups;
    }, {} as Record<string, { count: number; revenue: number; discounts: number; pending: number; delivered: number }>);

    return Object.entries(dailyGroups).map(([date, data]) => ({
      data: date,
      totalPedidos: data.count,
      receitaTotal: data.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      receitaLiquida: (data.revenue - data.discounts).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      totalDescontos: data.discounts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      pedidosPendentes: data.pending,
      pedidosEntregues: data.delivered
    }));
  }
} 