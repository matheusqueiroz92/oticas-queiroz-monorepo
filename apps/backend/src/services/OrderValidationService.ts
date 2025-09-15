import { getRepositories } from "../repositories/RepositoryFactory";
import type { IOrder, OrderProduct } from "../interfaces/IOrder";
import type { IProduct } from "../interfaces/IProduct";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import type { IProductRepository } from "../repositories/interfaces/IProductRepository";
import mongoose from "mongoose";

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export class OrderValidationService {
  private userRepository: IUserRepository;
  private productRepository: IProductRepository;

  constructor() {
    const { userRepository, productRepository } = getRepositories();
    this.userRepository = userRepository;
    this.productRepository = productRepository;
  }

  /**
   * Verifica se um produto é uma referência (string ou ObjectId)
   * @param product O produto a ser verificado
   * @returns True se o produto for uma referência, false caso contrário
   */
  private isProductReference(product: OrderProduct): product is string | mongoose.Types.ObjectId {
    return typeof product === 'string' || product instanceof mongoose.Types.ObjectId;
  }

  /**
   * Verifica se um produto é um objeto completo com _id
   * @param product O produto a ser verificado
   * @returns True se o produto for um objeto completo, false caso contrário
   */
  private isProductComplete(product: OrderProduct): product is IProduct {
    return typeof product === 'object' && product !== null && '_id' in product;
  }

  /**
   * Verifica se um produto é uma lente (qualquer tipo)
   * @param product O produto a ser verificado
   * @returns Promise que resolve para true se o produto for uma lente, false caso contrário
   */
  async isLensProduct(product: OrderProduct): Promise<boolean> {
    if (this.isProductReference(product)) {
      const id = product.toString();
      const completeProduct = await this.productRepository.findById(id);
      if (!completeProduct) return false;
      
      if (completeProduct.productType === 'lenses') {
        return true;
      }
      
      return typeof completeProduct.name === 'string' && completeProduct.name.toLowerCase().includes('lente');
    } 
    
    if (this.isProductComplete(product)) {
      if (product.productType === 'lenses') {
        return true;
      }
      
      return typeof product.name === 'string' && product.name.toLowerCase().includes('lente');
    }
    
    return false;
  }

  /**
   * Valida o cliente do pedido
   * @param clientId ID do cliente
   * @throws OrderValidationError se o cliente for inválido
   */
  async validateClient(clientId: string): Promise<void> {
    const client = await this.userRepository.findById(clientId);
    if (!client) {
      throw new OrderValidationError("Cliente não encontrado");
    }
    if (client.role !== "customer") {
      throw new OrderValidationError("ID fornecido não pertence a um cliente");
    }
  }

  /**
   * Valida o funcionário do pedido
   * @param employeeId ID do funcionário
   * @throws OrderValidationError se o funcionário for inválido
   */
  async validateEmployee(employeeId: string): Promise<void> {
    const employee = await this.userRepository.findById(employeeId);
    if (!employee) {
      throw new OrderValidationError("Funcionário não encontrado");
    }
    if (employee.role !== "employee" && employee.role !== "admin") {
      throw new OrderValidationError("ID fornecido não pertence a um funcionário");
    }
  }

  /**
   * Valida os produtos do pedido
   * @param products Lista de produtos
   * @throws OrderValidationError se algum produto for inválido
   */
  async validateProducts(products: OrderProduct[]): Promise<void> {
    if (!products || products.length === 0) {
      throw new OrderValidationError("Pelo menos um produto deve ser adicionado ao pedido");
    }

    for (const product of products) {
      if (this.isProductReference(product)) {
        const productId = product.toString();
        const productExists = await this.productRepository.findById(productId);
        if (!productExists) {
          throw new OrderValidationError(`Produto com ID ${productId} não encontrado`);
        }
      } 
      else if (this.isProductComplete(product)) {
        if (!product._id) {
          throw new OrderValidationError("Todos os produtos devem ter um ID válido");
        }
        
        const productExists = await this.productRepository.findById(product._id);
        if (!productExists) {
          throw new OrderValidationError(`Produto com ID ${product._id} não encontrado`);
        }
      }
      else {
        throw new OrderValidationError("Formato de produto inválido");
      }
    }
  }

  /**
   * Valida os valores financeiros do pedido
   * @param totalPrice Preço total
   * @param discount Desconto (opcional)
   * @param installments Parcelas (opcional)
   * @param paymentEntry Entrada (opcional)
   * @throws OrderValidationError se algum valor for inválido
   */
  validateFinancialData(
    totalPrice: number,
    discount?: number,
    installments?: number,
    paymentEntry?: number
  ): void {
    if (totalPrice <= 0) {
      throw new OrderValidationError("Preço total deve ser maior que zero");
    }

    if (discount !== undefined && discount < 0) {
      throw new OrderValidationError("Desconto não pode ser negativo");
    }

    if (discount !== undefined && discount > totalPrice) {
      throw new OrderValidationError("Desconto não pode ser maior que o preço total");
    }

    if (installments !== undefined && installments <= 0) {
      throw new OrderValidationError("Número de parcelas deve ser maior que zero");
    }

    if (paymentEntry !== undefined && paymentEntry < 0) {
      throw new OrderValidationError("Valor de entrada não pode ser negativo");
    }
  }

  /**
   * Valida a data de entrega
   * @param deliveryDate Data de entrega
   * @param products Lista de produtos para verificar se há lentes
   * @throws OrderValidationError se a data for inválida
   */
  async validateDeliveryDate(deliveryDate?: Date, products?: OrderProduct[]): Promise<void> {
    if (!deliveryDate || !products) return;

    const deliveryDateObj = new Date(deliveryDate);
    deliveryDateObj.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const productLensChecks = await Promise.all(
      products.map(product => this.isLensProduct(product))
    );
    const hasLenses = productLensChecks.some(Boolean);
    
    if (hasLenses && deliveryDateObj < today) {
      throw new OrderValidationError("Pedidos com lentes exigem data de entrega futura");
    }
  }

  /**
   * Valida os dados de prescrição
   * @param prescriptionData Dados da prescrição
   * @throws OrderValidationError se os dados forem inválidos
   */
  validatePrescriptionData(prescriptionData?: { appointmentDate: Date }): void {
    if (!prescriptionData) return;

    const appointmentDate = new Date(prescriptionData.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate > today) {
      throw new OrderValidationError(
        "Data da consulta não pode ser no futuro"
      );
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    if (appointmentDate < oneYearAgo) {
      throw new OrderValidationError(
        "Data da consulta não pode ser mais antiga que um ano"
      );
    }
  }

  /**
   * Valida um pedido completo
   * @param orderData Dados do pedido
   * @throws OrderValidationError se alguma validação falhar
   */
  async validateOrder(orderData: Omit<IOrder, "_id">): Promise<void> {
    // Converter IDs para string se necessário
    const clientId = typeof orderData.clientId === 'string' ? orderData.clientId : orderData.clientId.toString();
    const employeeId = typeof orderData.employeeId === 'string' ? orderData.employeeId : orderData.employeeId.toString();

    // Validar cliente e funcionário
    await Promise.all([
      this.validateClient(clientId),
      this.validateEmployee(employeeId)
    ]);

    // Validar produtos
    await this.validateProducts(orderData.products);

    // Validar dados financeiros
    this.validateFinancialData(
      orderData.totalPrice,
      orderData.discount,
      orderData.installments,
      orderData.paymentEntry
    );

    // Validar data de entrega
    await this.validateDeliveryDate(orderData.deliveryDate, orderData.products);

    // Validar dados de prescrição se fornecidos
    this.validatePrescriptionData(orderData.prescriptionData);
  }

  /**
   * Valida permissões de atualização do pedido
   * @param userRole Papel do usuário
   * @param currentStatus Status atual do pedido
   * @param newStatus Novo status (opcional)
   * @throws OrderValidationError se a permissão for negada
   */
  validateUpdatePermissions(
    userRole: string,
    currentStatus: IOrder["status"],
    newStatus?: IOrder["status"]
  ): void {
    if (currentStatus === "cancelled") {
      throw new OrderValidationError("Não é possível atualizar pedido cancelado");
    }

    if (newStatus === "cancelled" && userRole !== "admin") {
      throw new OrderValidationError("Apenas administradores podem cancelar pedidos");
    }

    if (currentStatus === "delivered" && userRole !== "admin") {
      throw new OrderValidationError(
        "Apenas administradores podem modificar pedidos entregues"
      );
    }

    // Validar transições de status
    if (newStatus && currentStatus !== newStatus) {
      this.validateStatusTransition(currentStatus, newStatus);
    }
  }

  /**
   * Valida transições de status do pedido
   * @param currentStatus Status atual
   * @param newStatus Novo status
   * @throws OrderValidationError se a transição for inválida
   */
  private validateStatusTransition(currentStatus: IOrder["status"], newStatus: IOrder["status"]): void {
    const validTransitions: Record<IOrder["status"], IOrder["status"][]> = {
      pending: ["in_production", "cancelled"],
      in_production: ["ready", "cancelled"],
      ready: ["delivered", "cancelled"],
      delivered: [], // Não pode mudar de delivered
      cancelled: [], // Não pode mudar de cancelled
    };

    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new OrderValidationError(
        `Transição de status inválida: ${currentStatus} → ${newStatus}. Transições permitidas: ${allowedTransitions.join(", ")}`
      );
    }
  }

  /**
   * Valida cancelamento de pedido
   * @param orderStatus Status do pedido
   * @param userRole Papel do usuário
   * @throws OrderValidationError se o cancelamento não for permitido
   */
  validateCancellation(orderStatus: IOrder["status"], userRole: string): void {
    if (orderStatus === "cancelled") {
      throw new OrderValidationError("Pedido já está cancelado");
    }

    if (orderStatus === "delivered") {
      throw new OrderValidationError("Não é possível cancelar pedido já entregue");
    }

    if (userRole !== "admin") {
      throw new OrderValidationError("Apenas administradores podem cancelar pedidos");
    }
  }
} 