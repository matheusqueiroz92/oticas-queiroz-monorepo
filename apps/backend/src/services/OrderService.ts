import { OrderModel } from "../models/OrderModel";
import { UserModel } from "../models/UserModel";
import { ProductModel } from "../models/ProductModel";
import type { CreateOrderDTO, IOrder, OrderProduct } from "../interfaces/IOrder";
import type { IProduct, ILens, ICleanLens } from "../interfaces/IProduct";
import { ExportUtils, type ExportOptions } from "../utils/exportUtils";
import mongoose from "mongoose";

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export class OrderService {
  private orderModel: OrderModel;
  private userModel: UserModel;
  private productModel: ProductModel;
  private exportUtils: ExportUtils;

  constructor() {
    this.orderModel = new OrderModel();
    this.userModel = new UserModel();
    this.productModel = new ProductModel();
    this.exportUtils = new ExportUtils();
  }

  // Type Guards para verificar o tipo de produto
  private isProductReference(product: OrderProduct): product is string | mongoose.Types.ObjectId {
    return typeof product === 'string' || product instanceof mongoose.Types.ObjectId;
  }

  private isProductComplete(product: OrderProduct): product is IProduct {
    return typeof product === 'object' && product !== null && '_id' in product;
  }

  private isLensType(product: IProduct): product is ILens {
    return product.productType === 'lenses';
  }
  
  private isCleanLensType(product: IProduct): product is ICleanLens {
    return product.productType === 'clean_lenses';
  }

  // Verifica se um produto é uma lente (com busca se necessário)
  private async isLensProduct(product: OrderProduct): Promise<boolean> {
    if (this.isProductReference(product)) {
      // Se for uma referência, buscar o produto completo
      const id = product.toString();
      const completeProduct = await this.productModel.findById(id);
      if (!completeProduct) return false;
      
      // Verificações explícitas para garantir tipagem correta
      if (completeProduct.productType === 'lenses' || completeProduct.productType === 'clean_lenses') {
        return true;
      }
      
      // Verificação do nome
      return typeof completeProduct.name === 'string' && 
             completeProduct.name.toLowerCase().includes('lente');
    } 
    
    if (this.isProductComplete(product)) {
      // Se já for um objeto completo
      // Verificações explícitas para garantir tipagem correta
      if (product.productType === 'lenses' || product.productType === 'clean_lenses') {
        return true;
      }
      
      // Verificação do nome
      return typeof product.name === 'string' && 
             product.name.toLowerCase().includes('lente');
    }
    
    return false;
  }

  private async validateOrder(orderData: Omit<IOrder, "_id">): Promise<void> {
    // Validar cliente
    const client = await this.userModel.findById(orderData.clientId.toString());
    if (!client) {
      throw new OrderError("Cliente não encontrado");
    }
    if (client.role !== "customer") {
      throw new OrderError("ID fornecido não pertence a um cliente");
    }

    // Validar funcionário
    const employee = await this.userModel.findById(orderData.employeeId.toString());
    if (!employee) {
      throw new OrderError("Funcionário não encontrado");
    }
    if (employee.role !== "employee" && employee.role !== "admin") {
      throw new OrderError("ID fornecido não pertence a um funcionário");
    }

    // Validar produtos
    if (!orderData.products || orderData.products.length === 0) {
      throw new OrderError("Pelo menos um produto deve ser adicionado ao pedido");
    }

    // Verificar cada produto
    for (const product of orderData.products) {
      // Se for uma referência (string ou ObjectId)
      if (this.isProductReference(product)) {
        const productId = product.toString();
        const productExists = await this.productModel.findById(productId);
        if (!productExists) {
          throw new OrderError(`Produto com ID ${productId} não encontrado`);
        }
      } 
      // Se for um objeto de produto completo
      else if (this.isProductComplete(product)) {
        if (!product._id) {
          throw new OrderError("Todos os produtos devem ter um ID válido");
        }
        
        const productExists = await this.productModel.findById(product._id);
        if (!productExists) {
          throw new OrderError(`Produto com ID ${product._id} não encontrado`);
        }
      }
      // Se não for nenhum dos tipos esperados
      else {
        throw new OrderError("Formato de produto inválido");
      }
    }

    // Validar valores
    if (orderData.totalPrice <= 0) {
      throw new OrderError("Preço total deve ser maior que zero");
    }

    if (orderData.discount !== undefined && orderData.discount < 0) {
      throw new OrderError("Desconto não pode ser negativo");
    }

    if (orderData.discount !== undefined && orderData.discount > orderData.totalPrice) {
      throw new OrderError("Desconto não pode ser maior que o preço total");
    }

    if (orderData.installments && orderData.installments <= 0) {
      throw new OrderError("Número de parcelas deve ser maior que zero");
    }

    if (orderData.paymentEntry && orderData.paymentEntry < 0) {
      throw new OrderError("Valor de entrada não pode ser negativo");
    }

    if (orderData.deliveryDate) {
      // Obter apenas a data, descartando horas, minutos e segundos
      const deliveryDate = new Date(orderData.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Verificar se há lentes no pedido - com Promise.all para processar em paralelo
      const productLensChecks = await Promise.all(
        orderData.products.map(product => this.isLensProduct(product))
      );
      const hasLenses = productLensChecks.some(Boolean);
      
      // Se tiver lentes, a data de entrega deve ser futura
      if (hasLenses && deliveryDate < today) {
        throw new OrderError("Pedidos com lentes exigem data de entrega futura");
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
      if (orderData.laboratoryId?.toString() === "") {
        orderData.laboratoryId = undefined;
      }
  
      // Calcular preço final se não fornecido
      if (orderData.finalPrice === undefined) {
        orderData.finalPrice = orderData.totalPrice - (orderData.discount || 0);
      }
  
      // Verificar se o pedido contém lentes para definir o status inicial
      const productLensChecks = await Promise.all(
        orderData.products.map(product => this.isLensProduct(product))
      );
      const containsLenses = productLensChecks.some(Boolean);
  
      // Se o status não foi fornecido, defina com base na presença de lentes
      if (!orderData.status) {
        orderData.status = containsLenses ? 'pending' : 'ready';
      }
  
      // Converte isDeleted para booleano explicitamente se for string
      // Corrigindo o erro: O tipo 'string | boolean' não pode ser atribuído ao tipo 'boolean'
      const isDeleted = typeof orderData.isDeleted === 'string' 
        ? orderData.isDeleted === 'true' 
        : Boolean(orderData.isDeleted);
  
      const orderDTO: CreateOrderDTO = {
        clientId: new mongoose.Types.ObjectId(orderData.clientId.toString()),
        employeeId: new mongoose.Types.ObjectId(orderData.employeeId.toString()),
        products: orderData.products,  // Produtos já validados
        paymentMethod: orderData.paymentMethod,
        paymentEntry: orderData.paymentEntry,
        installments: orderData.installments,
        orderDate: new Date(),  // Usar a data atual para o pedido
        deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : undefined,
        status: orderData.status,  // Status do pedido (agora baseado na presença de lentes)
        totalPrice: orderData.totalPrice,
        discount: orderData.discount || 0,
        finalPrice: orderData.finalPrice || (orderData.totalPrice - orderData.discount),
        isDeleted: isDeleted,
      };
  
      await this.validateOrder(orderData);
      const order = await this.orderModel.create(orderData);
  
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
    filters?: Record<string, any>
  ): Promise<{ orders: IOrder[]; total: number }> {
    // Sempre usar populate = true para garantir que os produtos são carregados
    const result = await this.orderModel.findAll(page, limit, filters, true);

    if (!result.orders.length) {
      throw new OrderError("Nenhum pedido encontrado");
    }

    return result;
  }

  async getOrderById(id: string): Promise<IOrder> {
    // Sempre usar populate = true
    const order = await this.orderModel.findById(id, true);
    if (!order) {
      throw new OrderError("Pedido não encontrado");
    }

    return order;
  }

  async getOrdersByClientId(clientId: string): Promise<IOrder[]> {
    // Sempre usar populate = true
    const orders = await this.orderModel.findByClientId(clientId, true);
    if (!orders.length) {
      throw new OrderError("Nenhum pedido encontrado para este cliente");
    }

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
    if (userRole === "customer" && userId !== order.clientId.toString()) {
      throw new OrderError("Sem permissão para atualizar este pedido");
    }

    // Validar transição de status
    const validTransitions: Record<IOrder["status"], IOrder["status"][]> = {
      pending: ["in_production", "cancelled"],
      in_production: ["ready", "cancelled"],
      ready: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new OrderError(
        `Não é possível alterar o status de ${order.status} para ${status}`
      );
    }

    // Sempre usar populate = true
    const updatedOrder = await this.orderModel.updateStatus(id, status, true);
    if (!updatedOrder) {
      throw new OrderError("Erro ao atualizar status do pedido");
    }

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
    if (userRole === "customer" && userId !== order.clientId.toString()) {
      throw new OrderError("Sem permissão para atualizar este pedido");
    }

    // Garantir que laboratoryId não é uma string vazia
    const validLaboratoryId = laboratoryId?.toString() === "" ? undefined : laboratoryId;

    // Sempre usar populate = true
    const updatedOrder = await this.orderModel.updateLaboratory(
      id,
      validLaboratoryId,
      true
    );
    if (!updatedOrder) {
      throw new OrderError("Erro ao atualizar o laboratório do pedido");
    }

    return updatedOrder;
  }

  async updateOrder(
    id: string,
    orderData: Partial<IOrder>,
    userId: string,
    userRole: string
  ): Promise<IOrder> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new OrderError("Pedido não encontrado");
    }

    // Verificar permissões
    if (userRole === "customer" && userId !== order.clientId.toString()) {
      throw new OrderError("Sem permissão para atualizar este pedido");
    }

    // Se estamos atualizando produtos, validar cada um
    if (orderData.products && orderData.products.length > 0) {
      for (const product of orderData.products) {
        if (this.isProductReference(product)) {
          const productId = product.toString();
          const productExists = await this.productModel.findById(productId);
          if (!productExists) {
            throw new OrderError(`Produto com ID ${productId} não encontrado`);
          }
        } else if (this.isProductComplete(product)) {
          if (!product._id) {
            throw new OrderError("Todos os produtos devem ter um ID válido");
          }
          
          const productExists = await this.productModel.findById(product._id);
          if (!productExists) {
            throw new OrderError(`Produto com ID ${product._id} não encontrado`);
          }
        }
      }
    }

    // Validar outros campos
    if (orderData.discount !== undefined && orderData.discount < 0) {
      throw new OrderError("Desconto não pode ser negativo");
    }

    if (orderData.totalPrice !== undefined && orderData.totalPrice <= 0) {
      throw new OrderError("Preço total deve ser maior que zero");
    }

    // Calcular preço final se necessário
    if ((orderData.totalPrice !== undefined || orderData.discount !== undefined) && 
        orderData.finalPrice === undefined) {
      const newTotalPrice = orderData.totalPrice ?? order.totalPrice;
      const newDiscount = orderData.discount ?? order.discount;
      orderData.finalPrice = newTotalPrice - newDiscount;
    }

    // Converter isDeleted para booleano se presente
    if (orderData.isDeleted !== undefined) {
      orderData.isDeleted = typeof orderData.isDeleted === 'string'
        ? orderData.isDeleted === 'true'
        : Boolean(orderData.isDeleted);
    }

    // Realizar atualização - sempre com populate = true
    const updatedOrder = await this.orderModel.update(id, orderData, true);
    if (!updatedOrder) {
      throw new OrderError("Erro ao atualizar pedido");
    }

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

      return deletedOrder;
    }
    throw new OrderError(
      "Apenas pedidos entregues ou cancelados podem ser excluídos"
    );
  }

  async getDeletedOrders(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {}
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
      (userRole !== "customer" || userId !== order.clientId.toString())
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

    return updatedOrder;
  }

  async getDailyOrders(date: Date = new Date()): Promise<IOrder[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await this.orderModel.findByDateRange(
      startOfDay,
      endOfDay,
      true
    );

    return orders;
  }

  /**
   * Exporta pedidos para diferentes formatos
   */
  async exportOrders(
    options: ExportOptions,
    filters: Record<string, any> = {}
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Buscar todos os pedidos que correspondem aos filtros (sem paginação)
    const result = await this.orderModel.findAll(1, 1000, filters, true);

    // Usar ExportUtils para exportar no formato solicitado
    return this.exportUtils.exportOrders(result.orders, options);
  }

  /**
   * Exporta resumo diário de pedidos
   */
  async exportDailySummary(
    date: Date,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const orders = await this.getDailyOrders(date);
  
    // Contar os diferentes tipos de produtos nos pedidos
    const productTypes = new Map<string, number>();
    
    // Processar todos os produtos em todos os pedidos
    orders.forEach(order => {
      order.products.forEach(prod => {
        if (this.isProductComplete(prod)) {
          const count = productTypes.get(prod.productType) || 0;
          productTypes.set(prod.productType, count + 1);
        }
      });
    });
  
    // Calcular dados do resumo
    const summary = {
      date: date.toISOString().split("T")[0],
      totalOrders: orders.length,
      ordersByStatus: {
        pending: orders.filter((o) => o.status === "pending").length,
        in_production: orders.filter((o) => o.status === "in_production").length,
        ready: orders.filter((o) => o.status === "ready").length,
        delivered: orders.filter((o) => o.status === "delivered").length,
        cancelled: orders.filter((o) => o.status === "cancelled").length,
      },
      totalValue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      totalDiscount: orders.reduce((sum, order) => sum + (order.discount || 0), 0),
      finalValue: orders.reduce((sum, order) => sum + order.finalPrice, 0),
      // Formatando ordersByType para compatibilidade com exportUtils
      ordersByType: {
        lenses: productTypes.get("lenses") || 0,
        clean_lenses: productTypes.get("clean_lenses") || 0,
        prescription_frame: productTypes.get("prescription_frame") || 0,
        sunglasses_frame: productTypes.get("sunglasses_frame") || 0
      },
      orders: orders,
    };
  
    // Usar ExportUtils para exportar no formato solicitado
    return this.exportUtils.exportOrdersSummary(summary, options);
  }

  /**
   * Exporta detalhes de um pedido específico
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