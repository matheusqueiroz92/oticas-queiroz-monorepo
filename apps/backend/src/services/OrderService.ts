import { OrderModel } from "../models/OrderModel";
import { UserModel } from "../models/UserModel";
import type { IOrder } from "../interfaces/IOrder";
import NodeCache from "node-cache";
import { ExportUtils, type ExportOptions } from "../utils/exportUtils";

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export class OrderService {
  private orderModel: OrderModel;
  private userModel: UserModel;
  private cache: NodeCache;
  private exportUtils: ExportUtils;

  constructor() {
    this.orderModel = new OrderModel();
    this.userModel = new UserModel();
    this.cache = new NodeCache({ stdTTL: 300 }); // Cache com expiração de 5 minutos
    this.exportUtils = new ExportUtils();
  }

  // Método para invalidar cache quando houver alterações
  private invalidateCache(keys: string | string[]): void {
    if (Array.isArray(keys)) {
      for (const key of keys) {
        this.cache.del(key);
      }
    } else {
      this.cache.del(keys);
    }
  }

  private async validateOrder(orderData: Omit<IOrder, "_id">): Promise<void> {
    // Validar cliente
    const client = await this.userModel.findById(orderData.clientId);
    if (!client) {
      throw new OrderError("Cliente não encontrado");
    }
    if (client.role !== "customer") {
      throw new OrderError("ID fornecido não pertence a um cliente");
    }

    // Validar funcionário
    const employee = await this.userModel.findById(orderData.employeeId);
    if (!employee) {
      throw new OrderError("Funcionário não encontrado");
    }
    if (employee.role !== "employee" && employee.role !== "admin") {
      throw new OrderError("ID fornecido não pertence a um funcionário");
    }

    // Validar dados básicos
    if (orderData.totalPrice <= 0) {
      throw new OrderError("Preço total deve ser maior que zero");
    }

    if (orderData.installments && orderData.installments <= 0) {
      throw new OrderError("Número de parcelas deve ser maior que zero");
    }

    if (orderData.paymentEntry && orderData.paymentEntry < 0) {
      throw new OrderError("Valor de entrada não pode ser negativo");
    }

    if (orderData.deliveryDate) {
      if (new Date(orderData.deliveryDate) < new Date()) {
        throw new OrderError("Data de entrega deve ser futura");
      }
    }

    // Validar dados da prescrição
    const { prescriptionData } = orderData;
    if (prescriptionData) {
      if (new Date(prescriptionData.appointmentDate) > new Date()) {
        throw new OrderError("Data da consulta não pode ser futura");
      }
    }
  }

  async createOrder(orderData: Omit<IOrder, "_id">): Promise<IOrder> {
    try {
      // Se laboratoryId for string vazia, definir como undefined
      if (orderData.laboratoryId === "") {
        orderData.laboratoryId = undefined;
      }

      await this.validateOrder(orderData);
      const order = await this.orderModel.create(orderData);

      // Invalidar caches relacionados
      this.invalidateCache([
        `client_orders_${orderData.clientId}`,
        "daily_orders",
        "all_orders",
      ]);

      return order;
    } catch (error) {
      if (error instanceof OrderError) {
        throw error;
      }
      console.error("Erro ao criar pedido:", error);
      throw new OrderError(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao criar pedido"
      );
    }
  }

  async getAllOrders(
    page?: number,
    limit?: number,
    filters?: Partial<IOrder>
  ): Promise<{ orders: IOrder[]; total: number }> {
    const cacheKey = `all_orders_page${page}_limit${limit}_${JSON.stringify(filters)}`;

    // Verificar cache
    const cachedResult = this.cache.get<{ orders: IOrder[]; total: number }>(
      cacheKey
    );
    if (cachedResult) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedResult;
    }

    const result = await this.orderModel.findAll(page, limit, filters, true);
    if (!result.orders.length) {
      throw new OrderError("Nenhum pedido encontrado");
    }

    // Armazenar em cache
    this.cache.set(cacheKey, result);

    return result;
  }

  async getOrderById(id: string): Promise<IOrder> {
    const cacheKey = `order_${id}`;

    // Verificar cache
    const cachedOrder = this.cache.get<IOrder>(cacheKey);
    if (cachedOrder) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedOrder;
    }

    const order = await this.orderModel.findById(id, true);
    if (!order) {
      throw new OrderError("Pedido não encontrado");
    }

    // Armazenar em cache
    this.cache.set(cacheKey, order);

    return order;
  }

  async getOrdersByClientId(clientId: string): Promise<IOrder[]> {
    const cacheKey = `client_orders_${clientId}`;

    // Verificar cache
    const cachedOrders = this.cache.get<IOrder[]>(cacheKey);
    if (cachedOrders) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedOrders;
    }

    const orders = await this.orderModel.findByClientId(clientId, true);
    if (!orders.length) {
      throw new OrderError("Nenhum pedido encontrado para este cliente");
    }

    // Armazenar em cache
    this.cache.set(cacheKey, orders);

    return orders;
  }

  async updateOrderStatus(
    id: string,
    status: IOrder["status"],
    userId: string,
    userRole: string
  ): Promise<IOrder> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new OrderError("Pedido não encontrado");
    }

    // Verificar permissões
    if (userRole === "customer" && userId !== order.clientId) {
      throw new OrderError("Sem permissão para atualizar este pedido");
    }

    // Validar transição de status
    const validTransitions: Record<IOrder["status"], IOrder["status"][]> = {
      pending: ["in_production"],
      in_production: ["ready"],
      ready: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new OrderError(
        `Não é possível alterar o status de ${order.status} para ${status}`
      );
    }

    const updatedOrder = await this.orderModel.updateStatus(id, status, true);
    if (!updatedOrder) {
      throw new OrderError("Erro ao atualizar status do pedido");
    }

    // Invalidar caches relacionados
    this.invalidateCache([
      `order_${id}`,
      `client_orders_${order.clientId}`,
      "daily_orders",
      "all_orders",
    ]);

    return updatedOrder;
  }

  async updateOrderLaboratory(
    id: string,
    laboratoryId: IOrder["laboratoryId"],
    userId: string,
    userRole: string
  ): Promise<IOrder> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new OrderError("Pedido não encontrado");
    }

    // Verificar permissões
    if (userRole === "customer" && userId !== order.clientId) {
      throw new OrderError("Sem permissão para atualizar este pedido");
    }

    // Garantir que laboratoryId não é uma string vazia
    const validLaboratoryId = laboratoryId === "" ? undefined : laboratoryId;

    const updatedOrder = await this.orderModel.updateLaboratory(
      id,
      validLaboratoryId,
      true
    );
    if (!updatedOrder) {
      throw new OrderError("Erro ao atualizar o laboratório do pedido");
    }

    // Invalidar caches relacionados
    this.invalidateCache([
      `order_${id}`,
      `client_orders_${order.clientId}`,
      "all_orders",
    ]);

    return updatedOrder;
  }

  async softDeleteOrder(
    id: string,
    userId: string,
    userRole: string
  ): Promise<IOrder> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new OrderError("Pedido não encontrado");
    }

    // Verificar permissões - apenas admin ou funcionário pode excluir
    if (userRole !== "admin" && userRole !== "employee") {
      throw new OrderError("Sem permissão para excluir este pedido");
    }

    // Verificar se o pedido está no status "delivered" ou "cancelled"
    if (order.status === "delivered" || order.status === "cancelled") {
      const deletedOrder = await this.orderModel.softDelete(id, userId);
      if (!deletedOrder) {
        throw new OrderError("Erro ao excluir pedido");
      }

      // Invalidar caches relacionados
      this.invalidateCache([
        `order_${id}`,
        `client_orders_${order.clientId}`,
        "daily_orders",
        "all_orders",
      ]);

      return deletedOrder;
    }
    throw new OrderError(
      "Apenas pedidos entregues ou cancelados podem ser excluídos"
    );
  }

  async getDeletedOrders(
    page = 1,
    limit = 10,
    filters: Partial<IOrder> = {}
  ): Promise<{ orders: IOrder[]; total: number }> {
    return this.orderModel.findDeletedOrders(page, limit, filters);
  }

  async cancelOrder(
    id: string,
    userId: string,
    userRole: string
  ): Promise<IOrder> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new OrderError("Pedido não encontrado");
    }

    // Apenas admin, funcionário ou o próprio cliente podem cancelar
    if (
      userRole !== "admin" &&
      userRole !== "employee" &&
      (userRole !== "customer" || userId !== order.clientId)
    ) {
      throw new OrderError("Sem permissão para cancelar este pedido");
    }

    // Não pode cancelar pedido já entregue
    if (order.status === "delivered") {
      throw new OrderError("Não é possível cancelar um pedido já entregue");
    }

    // Não pode cancelar pedido já cancelado
    if (order.status === "cancelled") {
      throw new OrderError("O pedido já está cancelado");
    }

    const updatedOrder = await this.orderModel.updateStatus(
      id,
      "cancelled",
      true
    );
    if (!updatedOrder) {
      throw new OrderError("Erro ao cancelar pedido");
    }

    // Invalidar caches relacionados
    this.invalidateCache([
      `order_${id}`,
      `client_orders_${order.clientId}`,
      "daily_orders",
      "all_orders",
    ]);

    return updatedOrder;
  }

  async getDailyOrders(date: Date): Promise<IOrder[]> {
    const dateString = date.toISOString().split("T")[0];
    const cacheKey = `daily_orders_${dateString}`;

    // Verificar cache
    const cachedOrders = this.cache.get<IOrder[]>(cacheKey);
    if (cachedOrders) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedOrders;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await this.orderModel.findByDateRange(
      startOfDay,
      endOfDay,
      true
    );

    // Armazenar em cache
    this.cache.set(cacheKey, orders);

    return orders;
  }

  /**
   * Exporta pedidos para diferentes formatos
   * @param options Opções de exportação
   * @param filters Filtros para selecionar pedidos
   * @returns Buffer com os dados exportados e metadados
   */
  async exportOrders(
    options: ExportOptions,
    filters: Partial<IOrder> = {}
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Buscar todos os pedidos que correspondem aos filtros (sem paginação)
    const result = await this.orderModel.findAll(1, 1000, filters, true);

    // Usar ExportUtils para exportar no formato solicitado
    return this.exportUtils.exportOrders(result.orders, options);
  }

  /**
   * Exporta resumo diário de pedidos
   * @param date Data para o resumo
   * @param options Opções de exportação
   * @returns Buffer com os dados exportados e metadados
   */
  async exportDailySummary(
    date: Date,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const orders = await this.getDailyOrders(date);

    // Calcular dados do resumo
    const summary = {
      date: date.toISOString().split("T")[0],
      totalOrders: orders.length,
      ordersByStatus: {
        pending: orders.filter((o) => o.status === "pending").length,
        in_production: orders.filter((o) => o.status === "in_production")
          .length,
        ready: orders.filter((o) => o.status === "ready").length,
        delivered: orders.filter((o) => o.status === "delivered").length,
        cancelled: orders.filter((o) => o.status === "cancelled").length,
      },
      totalValue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      ordersByType: {
        glasses: orders.filter((o) => o.productType === "glasses").length,
        lensCleaner: orders.filter((o) => o.productType === "lensCleaner")
          .length,
      },
      orders: orders,
    };

    // Usar ExportUtils para exportar no formato solicitado
    return this.exportUtils.exportOrdersSummary(summary, options);
  }

  /**
   * Exporta detalhes de um pedido específico
   * @param id ID do pedido
   * @param options Opções de exportação
   * @returns Buffer com os dados exportados e metadados
   */
  async exportOrderDetails(
    id: string,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const order = await this.getOrderById(id);

    // Usar ExportUtils para exportar no formato solicitado
    return this.exportUtils.exportOrderDetails(order, options);
  }
}
