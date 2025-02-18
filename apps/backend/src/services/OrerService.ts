import { OrderModel } from "../models/OrderModel";
import { UserModel } from "../models/UserModel";
import { ProductModel } from "../models/ProductModel";
import type { IOrder } from "../interfaces/IOrder";

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

  constructor() {
    this.orderModel = new OrderModel();
    this.userModel = new UserModel();
    this.productModel = new ProductModel();
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

    // Validar produtos
    for (const productId of orderData.products) {
      const product = await this.productModel.findById(productId);
      if (!product) {
        throw new OrderError(`Produto não encontrado: ${productId}`);
      }
      if (product.stock <= 0) {
        throw new OrderError(`Produto sem estoque: ${product.name}`);
      }
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

    if (new Date(orderData.deliveryDate) < new Date()) {
      throw new OrderError("Data de entrega deve ser futura");
    }

    // Validar dados da prescrição
    const { prescriptionData } = orderData;
    if (new Date(prescriptionData.appointmentdate) > new Date()) {
      throw new OrderError("Data da consulta não pode ser futura");
    }
  }

  async createOrder(orderData: Omit<IOrder, "_id">): Promise<IOrder> {
    await this.validateOrder(orderData);

    // Reduzir estoque dos produtos
    for (const productId of orderData.products) {
      await this.productModel.updateStock(productId, -1);
    }

    return this.orderModel.create(orderData);
  }

  async getAllOrders(
    page?: number,
    limit?: number,
    filters?: Partial<IOrder>
  ): Promise<{ orders: IOrder[]; total: number }> {
    const result = await this.orderModel.findAll(page, limit, filters, true);
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

    return updatedOrder;
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

    // Apenas admin ou o próprio cliente podem cancelar
    if (
      userRole !== "admin" &&
      (userRole !== "customer" || userId !== order.clientId)
    ) {
      throw new OrderError("Sem permissão para cancelar este pedido");
    }

    // Não pode cancelar pedido já entregue
    if (order.status === "delivered") {
      throw new OrderError("Não é possível cancelar um pedido já entregue");
    }

    // Restaurar estoque dos produtos
    for (const productId of order.products) {
      await this.productModel.updateStock(productId, 1);
    }

    await this.orderModel.delete(id);
    return order;
  }
}
