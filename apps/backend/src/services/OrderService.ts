import { OrderModel } from "../models/OrderModel";
import { PaymentModel } from "../models/PaymentModel";
import { UserModel } from "../models/UserModel";
import { ProductModel } from "../models/ProductModel";
import { StockService } from "./StockService";
import type { CreateOrderDTO, IOrder, OrderProduct } from "../interfaces/IOrder";
import type { IProduct, ILens, ICleanLens } from "../interfaces/IProduct";
import { ExportUtils, type ExportOptions } from "../utils/exportUtils";
import mongoose from "mongoose";
import { IPayment } from "src/interfaces/IPayment";

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export class OrderService {
  private orderModel: OrderModel;
  private paymentModel: PaymentModel;
  private userModel: UserModel;
  private productModel: ProductModel;
  private exportUtils: ExportUtils;
  private stockService: StockService;

  constructor() {
    this.orderModel = new OrderModel();
    this.paymentModel = new PaymentModel();
    this.userModel = new UserModel();
    this.productModel = new ProductModel();
    this.exportUtils = new ExportUtils();
    this.stockService = new StockService();
  }

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

  private async isLensProduct(product: OrderProduct): Promise<boolean> {
    if (this.isProductReference(product)) {
      const id = product.toString();
      const completeProduct = await this.productModel.findById(id);
      if (!completeProduct) return false;
      
      if (completeProduct.productType === 'lenses' || completeProduct.productType === 'clean_lenses') {
        return true;
      }
      
      return typeof completeProduct.name === 'string' && completeProduct.name.toLowerCase().includes('lente');
    } 
    
    if (this.isProductComplete(product)) {
      if (product.productType === 'lenses' || product.productType === 'clean_lenses') {
        return true;
      }
      
      return typeof product.name === 'string' && product.name.toLowerCase().includes('lente');
    }
    
    return false;
  }

  private async validateOrder(orderData: Omit<IOrder, "_id">): Promise<void> {
    const client = await this.userModel.findById(orderData.clientId.toString());
    if (!client) {
      throw new OrderError("Cliente não encontrado");
    }
    if (client.role !== "customer") {
      throw new OrderError("ID fornecido não pertence a um cliente");
    }

    const employee = await this.userModel.findById(orderData.employeeId.toString());
    if (!employee) {
      throw new OrderError("Funcionário não encontrado");
    }
    if (employee.role !== "employee" && employee.role !== "admin") {
      throw new OrderError("ID fornecido não pertence a um funcionário");
    }

    if (!orderData.products || orderData.products.length === 0) {
      throw new OrderError("Pelo menos um produto deve ser adicionado ao pedido");
    }

    for (const product of orderData.products) {
      if (this.isProductReference(product)) {
        const productId = product.toString();
        const productExists = await this.productModel.findById(productId);
        if (!productExists) {
          throw new OrderError(`Produto com ID ${productId} não encontrado`);
        }
      } 
      else if (this.isProductComplete(product)) {
        if (!product._id) {
          throw new OrderError("Todos os produtos devem ter um ID válido");
        }
        
        const productExists = await this.productModel.findById(product._id);
        if (!productExists) {
          throw new OrderError(`Produto com ID ${product._id} não encontrado`);
        }
      }
      else {
        throw new OrderError("Formato de produto inválido");
      }
    }

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
      const deliveryDate = new Date(orderData.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const productLensChecks = await Promise.all(
        orderData.products.map(product => this.isLensProduct(product))
      );
      const hasLenses = productLensChecks.some(Boolean);
      
      if (hasLenses && deliveryDate < today) {
        throw new OrderError("Pedidos com lentes exigem data de entrega futura");
      }
    }

    const { prescriptionData } = orderData;
    if (prescriptionData) {
      if (new Date(prescriptionData.appointmentDate) > new Date()) {
        throw new OrderError("Data da consulta não pode ser futura");
      }
    }
  }

  /**
   * Atualiza o campo sales do funcionário (employee) após criar um pedido
   * @param employeeId ID do funcionário
   * @param orderId ID do pedido
   */
  private async updateEmployeeSales(employeeId: string, orderId: string): Promise<void> {
    try {
      const employee = await this.userModel.findById(employeeId);
      if (!employee) {
        console.error(`Funcionário com ID ${employeeId} não encontrado para atualizar vendas`);
        return;
      }

      // Garantir que o array sales existe
      const sales = employee.sales || [];
      
      // Adicionar o ID do pedido se ainda não estiver presente
      if (!sales.includes(orderId)) {
        await this.userModel.update(employeeId, {
          sales: [...sales, orderId]
        });
        console.log(`Venda ${orderId} adicionada ao funcionário ${employeeId}`);
      }
    } catch (error) {
      console.error(`Erro ao atualizar vendas do funcionário ${employeeId}:`, error);
    }
  }

  /**
   * Atualiza o campo purchases do cliente (customer) após criar um pedido
   * @param clientId ID do cliente
   * @param orderId ID do pedido
   */
  private async updateCustomerPurchases(clientId: string, orderId: string): Promise<void> {
    try {
      const customer = await this.userModel.findById(clientId);
      if (!customer) {
        console.error(`Cliente com ID ${clientId} não encontrado para atualizar compras`);
        return;
      }

      // Garantir que o array purchases existe
      const purchases = customer.purchases || [];
      
      // Adicionar o ID do pedido se ainda não estiver presente
      if (!purchases.includes(orderId)) {
        await this.userModel.update(clientId, {
          purchases: [...purchases, orderId]
        });
        console.log(`Compra ${orderId} adicionada ao cliente ${clientId}`);
      }
    } catch (error) {
      console.error(`Erro ao atualizar compras do cliente ${clientId}:`, error);
    }
  }

  /**
   * Atualiza o campo debts do cliente quando o pagamento é parcelado
   * @param clientId ID do cliente
   * @param orderData Dados do pedido
   */
  private async updateCustomerDebts(clientId: string, orderData: Omit<IOrder, "_id">): Promise<void> {
    try {
      // Verificar se o método de pagamento é parcelado
      const isInstallment = orderData.paymentMethod === "bank_slip" || 
                           orderData.paymentMethod === "promissory_note";
      
      if (!isInstallment) {
        return; // Não é necessário atualizar dívidas para outros métodos
      }

      if (orderData.isInstitutionalOrder && orderData.institutionId) {
        const institution = await this.userModel.findById(orderData.institutionId.toString());
        if (!institution) {
          console.error(`Instituição com ID ${orderData.institutionId} não encontrada para atualizar dívidas`);
          return;
        }
  
        // Calcular o valor da dívida (preço final - entrada se houver)
        const debtAmount = orderData.finalPrice - (orderData.paymentEntry || 0);
        
        if (debtAmount <= 0) {
          return; // Não há dívida a ser adicionada
        }
  
        // Atualizar a dívida da instituição
        const currentDebt = institution.debts || 0;
        await this.userModel.update(orderData.institutionId.toString(), {
          debts: currentDebt + debtAmount
        });
        
        console.log(`Dívida de ${debtAmount} adicionada à instituição ${orderData.institutionId}`);
        return;
      }

      const customer = await this.userModel.findById(clientId);
      if (!customer) {
        console.error(`Cliente com ID ${clientId} não encontrado para atualizar dívidas`);
        return;
      }

      // Calcular o valor da dívida (preço final - entrada se houver)
      const debtAmount = orderData.finalPrice - (orderData.paymentEntry || 0);
      
      if (debtAmount <= 0) {
        return; // Não há dívida a ser adicionada
      }

      // Atualizar a dívida do cliente
      const currentDebt = customer.debts || 0;
      await this.userModel.update(clientId, {
        debts: currentDebt + debtAmount
      });
      
      console.log(`Dívida de ${debtAmount} adicionada ao cliente ${clientId}`);
    } catch (error) {
      console.error(`Erro ao atualizar dívidas do cliente ${clientId}:`, error);
    }
  }

  async createOrder(orderData: Omit<IOrder, "_id">): Promise<IOrder> {
    const session = await mongoose.connection.startSession();
    session.startTransaction();
    
    try {
      if (orderData.laboratoryId?.toString() === "") {
        orderData.laboratoryId = undefined;
      }
  
      if (orderData.finalPrice === undefined) {
        orderData.finalPrice = orderData.totalPrice - (orderData.discount || 0);
      }
  
      const productLensChecks = await Promise.all(
        orderData.products.map(product => this.isLensProduct(product))
      );
      const containsLenses = productLensChecks.some(Boolean);
  
      if (!orderData.status) {
        orderData.status = containsLenses ? 'pending' : 'ready';
      }
  
      const isDeleted = typeof orderData.isDeleted === 'string' 
        ? orderData.isDeleted === 'true' 
        : Boolean(orderData.isDeleted);
  
      const orderDTO: CreateOrderDTO = {
        clientId: new mongoose.Types.ObjectId(orderData.clientId.toString()),
        employeeId: new mongoose.Types.ObjectId(orderData.employeeId.toString()),
        products: orderData.products,
        serviceOrder: orderData.serviceOrder,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus || "pending",
        paymentEntry: orderData.paymentEntry,
        installments: orderData.installments,
        orderDate: new Date(),
        deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : undefined,
        status: orderData.status,
        laboratoryId: orderData.laboratoryId ? new mongoose.Types.ObjectId(orderData.laboratoryId.toString()) : undefined,
        prescriptionData: orderData.prescriptionData,
        observations: orderData.observations,
        totalPrice: orderData.totalPrice,
        discount: orderData.discount || 0,
        finalPrice: orderData.finalPrice || (orderData.totalPrice - (orderData.discount || 0)),
        isDeleted: isDeleted,
      };
  
      await this.validateOrder(orderData);
      
      // Criar o pedido usando a sessão
      const order = await this.orderModel.createWithSession(orderDTO, session);
  
      if (order.status !== 'cancelled') {
        try {
          // Processar o estoque usando a mesma sessão
          await this.stockService.processOrderProducts(
            order.products, 
            'decrease',
            orderData.employeeId.toString(),
            order._id?.toString()
          );
        } catch (stockError) {
          console.error('Erro ao processar estoque para o pedido:', stockError);
          // Ocorreu um erro no processamento do estoque, abortar a transação
          await session.abortTransaction();
          throw stockError;
        }
      }
  
      // INÍCIO DAS MODIFICAÇÕES: Atualizar relacionamentos
      if (order._id) {
        const orderId = order._id.toString();
        const clientId = orderData.clientId.toString();
        const employeeId = orderData.employeeId.toString();
  
        // 1. Atualizar vendas do funcionário
        try {
          const employee = await this.userModel.findById(employeeId);
          if (employee) {
            const sales = employee.sales || [];
            if (!sales.includes(orderId)) {
              await this.userModel.update(employeeId, {
                sales: [...sales, orderId]
              });
              console.log(`Venda ${orderId} adicionada ao funcionário ${employeeId}`);
            }
          }
        } catch (error) {
          console.error(`Erro ao atualizar vendas do funcionário ${employeeId}:`, error);
        }
        
        // 2. Atualizar compras do cliente
        try {
          const customer = await this.userModel.findById(clientId);
          if (customer) {
            const purchases = customer.purchases || [];
            if (!purchases.includes(orderId)) {
              await this.userModel.update(clientId, {
                purchases: [...purchases, orderId]
              });
              console.log(`Compra ${orderId} adicionada ao cliente ${clientId}`);
            }
          }
        } catch (error) {
          console.error(`Erro ao atualizar compras do cliente ${clientId}:`, error);
        }
        
        // 3. Atualizar dívidas do cliente se necessário
        if (orderData.paymentMethod === "bank_slip" || orderData.paymentMethod === "promissory_note") {
          try {
            const customer = await this.userModel.findById(clientId);
            if (customer) {
              const debtAmount = orderData.finalPrice - (orderData.paymentEntry || 0);
              if (debtAmount > 0) {
                const currentDebt = customer.debts || 0;
                await this.userModel.update(clientId, {
                  debts: currentDebt + debtAmount
                });
                console.log(`Dívida de ${debtAmount} adicionada ao cliente ${clientId}`);
              }
            }
          } catch (error) {
            console.error(`Erro ao atualizar dívidas do cliente ${clientId}:`, error);
          }
        }
      }
      // FIM DAS MODIFICAÇÕES
  
      // Tudo ocorreu bem, comitar a transação
      await session.commitTransaction();
      return order;
    } catch (error) {
      // Ocorreu um erro, abortar a transação
      await session.abortTransaction();
      
      if (error instanceof OrderError) {
        throw error;
      }
      console.error("Erro ao criar pedido:", error);
      throw new OrderError(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao criar pedido"
      );
    } finally {
      session.endSession();
    }
  }

  async getAllOrders(
    page?: number,
    limit?: number,
    filters?: Record<string, any>
  ): Promise<{ orders: IOrder[]; total: number }> {
    const queryFilters = filters || {};
    
    if (!queryFilters.sort) {
      queryFilters.sort = "-createdAt";
    }
    
    const result = await this.orderModel.findAll(page, limit, queryFilters, true);

    if (!result.orders.length) {
      throw new OrderError("Nenhum pedido encontrado");
    }

    return result;
  }

  async getOrderById(id: string): Promise<IOrder> {
    const order = await this.orderModel.findById(id, true);
    if (!order) {
      throw new OrderError("Pedido não encontrado");
    }

    return order;
  }

  async getOrdersByClientId(clientId: string): Promise<IOrder[]> {
    const orders = await this.orderModel.findByClientId(clientId, true);
    if (!orders.length) {
      throw new OrderError("Nenhum pedido encontrado para este cliente");
    }

    console.log(orders, "Order Service");
    
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
  
    if (userRole === "customer" && userId !== order.clientId.toString()) {
      throw new OrderError("Sem permissão para atualizar o status deste pedido");
    }
  
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

    if (order.status === "pending" && status === "in_production") {
      if (!order.laboratoryId) {
        throw new OrderError(
          "Não é possível alterar o status para 'Em Produção' sem associar um laboratório ao pedido"
        );
      }
    }
  
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const updatedOrder = await this.orderModel.updateStatus(id, status, true);
      
      if (!updatedOrder) {
        throw new OrderError("Erro ao atualizar status do pedido");
      }
  
      try {
        await this.stockService.processOrderProducts(
          order.products, 
          'increase', 
          userId,
          id
        );
      } catch (stockError) {
        console.error('Erro ao restaurar estoque após cancelamento:', stockError);
      }
      
      return updatedOrder;
    }
    
    if (order.status === 'cancelled' && status !== 'cancelled') {
      const updatedOrder = await this.orderModel.updateStatus(id, status, true);
      
      if (!updatedOrder) {
        throw new OrderError("Erro ao atualizar status do pedido");
      }
      
      try {
        await this.stockService.processOrderProducts(
          order.products, 
          'decrease',
          userId,
          id
        );
      } catch (stockError) {
        console.error('Erro ao atualizar estoque após reativação:', stockError);
      }
      
      return updatedOrder;
    }
  
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

    if (userRole === "customer" && userId !== order.clientId.toString()) {
      throw new OrderError("Sem permissão para atualizar este pedido");
    }

    const validLaboratoryId = laboratoryId?.toString() === "" ? undefined : laboratoryId;

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

    if (userRole === "customer" && userId !== order.clientId.toString()) {
      throw new OrderError("Sem permissão para atualizar este pedido");
    }

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

    if (orderData.discount !== undefined && orderData.discount < 0) {
      throw new OrderError("Desconto não pode ser negativo");
    }

    if (orderData.totalPrice !== undefined && orderData.totalPrice <= 0) {
      throw new OrderError("Preço total deve ser maior que zero");
    }

    if ((orderData.totalPrice !== undefined || orderData.discount !== undefined) && 
        orderData.finalPrice === undefined) {
      const newTotalPrice = orderData.totalPrice ?? order.totalPrice;
      const newDiscount = orderData.discount ?? order.discount;
      orderData.finalPrice = newTotalPrice - newDiscount;
    }

    if (orderData.isDeleted !== undefined) {
      orderData.isDeleted = typeof orderData.isDeleted === 'string'
        ? orderData.isDeleted === 'true'
        : Boolean(orderData.isDeleted);
    }

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

    if (userRole !== "admin" && userRole !== "employee") {
      throw new OrderError("Sem permissão para excluir este pedido");
    }

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
    const session = await mongoose.connection.startSession();
    session.startTransaction();
    
    try {
      const order = await this.orderModel.findById(id);
      if (!order) {
        throw new OrderError("Pedido não encontrado");
      }
  
      if (
        userRole !== "admin" &&
        userRole !== "employee" &&
        (userRole !== "customer" || userId !== order.clientId.toString())
      ) {
        throw new OrderError("Sem permissão para cancelar este pedido");
      }
  
      if (order.status === "delivered") {
        throw new OrderError("Não é possível cancelar um pedido já entregue");
      }
  
      if (order.status === "cancelled") {
        throw new OrderError("O pedido já está cancelado");
      }
  
      // Atualizar o status com a sessão
      const updatedOrder = await this.orderModel.updateStatus(
        id,
        "cancelled",
        true
      );
  
      if (!updatedOrder) {
        throw new OrderError("Erro ao cancelar pedido");
      }
  
      try {
        // Processar o estoque para restaurar as quantidades
        await this.stockService.processOrderProducts(
          order.products, 
          'increase',
          userId,
          id
        );
        
        // Caso o pedido tenha gerado dívida para o cliente, atualizar
        if (
          (order.paymentMethod === "bank_slip" || order.paymentMethod === "promissory_note") && 
          order.clientId
        ) {
          const clientId = order.clientId.toString();
          const customer = await this.userModel.findById(clientId);
          
          if (customer && customer.debts) {
            const debtAmount = -(order.finalPrice - (order.paymentEntry || 0));
            if (debtAmount < 0) { // É negativo pois estamos removendo a dívida
              const newDebt = Math.max(0, (customer.debts || 0) + debtAmount); // Evita dívida negativa
              await this.userModel.update(clientId, {
                debts: newDebt
              });
              console.log(`Dívida reduzida em ${Math.abs(debtAmount)} para o cliente ${clientId} após cancelamento do pedido`);
            }
          }
        }
      } catch (stockError) {
        console.error('Erro ao restaurar estoque após cancelamento:', stockError);
        await session.abortTransaction();
        throw stockError;
      }
  
      // Tudo ocorreu bem, comitar a transação
      await session.commitTransaction();
      return updatedOrder;
    } catch (error) {
      // Ocorreu um erro, abortar a transação
      await session.abortTransaction();
      
      if (error instanceof OrderError) {
        throw error;
      }
      console.error("Erro ao cancelar pedido:", error);
      throw new OrderError(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao cancelar pedido"
      );
    } finally {
      session.endSession();
    }
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

  async exportOrders(
    options: ExportOptions,
    filters: Record<string, any> = {}
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const result = await this.orderModel.findAll(1, 1000, filters, true);

    return this.exportUtils.exportOrders(result.orders, options);
  }

  async exportDailySummary(
    date: Date,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const orders = await this.getDailyOrders(date);
  
    const productTypes = new Map<string, number>();
    
    orders.forEach(order => {
      order.products.forEach(prod => {
        if (this.isProductComplete(prod)) {
          const count = productTypes.get(prod.productType) || 0;
          productTypes.set(prod.productType, count + 1);
        }
      });
    });
  
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
      ordersByType: {
        lenses: productTypes.get("lenses") || 0,
        clean_lenses: productTypes.get("clean_lenses") || 0,
        prescription_frame: productTypes.get("prescription_frame") || 0,
        sunglasses_frame: productTypes.get("sunglasses_frame") || 0
      },
      orders: orders,
    };
  
    return this.exportUtils.exportOrdersSummary(summary, options);
  }

  async exportOrderDetails(
    id: string,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const order = await this.getOrderById(id);

    return this.exportUtils.exportOrderDetails(order, options);
  }

  async getOrdersByServiceOrder(serviceOrder: string): Promise<IOrder[]> {
    const cleanServiceOrder = serviceOrder.replace(/\D/g, '');
    
    if (cleanServiceOrder.length < 4 || cleanServiceOrder.length > 7) {
      throw new OrderError("Número de ordem de serviço deve ter entre 4 e 7 dígitos");
    }
    
    const orders = await this.orderModel.findByServiceOrder(cleanServiceOrder);
    
    if (!orders.length) {
      return [];
    }
    
    return orders;
  }

  async getClientsByServiceOrder(serviceOrder: string): Promise<string[]> {
    const orders = await this.getOrdersByServiceOrder(serviceOrder);
    
    const clientIds = [...new Set(orders.map(order => order.clientId.toString()))];
    
    return clientIds;
  }

  async getOrderPayments(orderId: string): Promise<Array<IPayment>> {
    const order = await this.orderModel.findById(orderId);
    if (!order || !order.paymentHistory || order.paymentHistory.length === 0) {
      return [];
    }
    
    const paymentIds = order.paymentHistory.map(entry => entry.paymentId.toString());
    const payments = await this.paymentModel.findByIds(paymentIds);
    
    return payments;
  }
  
  async getPaymentStatusSummary(orderId: string): Promise<{
    totalPrice: number;
    totalPaid: number;
    remainingAmount: number;
    paymentStatus: string;
    lastPaymentDate?: Date;
  }> {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new OrderError("Pedido não encontrado");
    }
    
    const totalPaid = order.paymentHistory?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
    
    const sortedHistory = [...(order.paymentHistory || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return {
      totalPrice: order.finalPrice,
      totalPaid,
      remainingAmount: Math.max(0, order.finalPrice - totalPaid),
      paymentStatus: order.paymentStatus,
      lastPaymentDate: sortedHistory.length > 0 ? sortedHistory[0].date : undefined
    };
  }
}