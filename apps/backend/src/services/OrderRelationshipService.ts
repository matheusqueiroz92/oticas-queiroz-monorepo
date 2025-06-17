import { getRepositories } from "../repositories/RepositoryFactory";
import type { IOrder } from "../interfaces/IOrder";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import type { ILegacyClientRepository } from "../repositories/interfaces/ILegacyClientRepository";

export class OrderRelationshipService {
  private userRepository: IUserRepository;
  private legacyClientRepository: ILegacyClientRepository;

  constructor() {
    const { userRepository, legacyClientRepository } = getRepositories();
    this.userRepository = userRepository;
    this.legacyClientRepository = legacyClientRepository;
  }

  /**
   * Atualiza o campo sales do funcionário (employee) após criar um pedido
   * @param employeeId ID do funcionário
   * @param orderId ID do pedido
   */
  async updateEmployeeSales(employeeId: string, orderId: string): Promise<void> {
    const employee = await this.userRepository.findById(employeeId);
    if (!employee) {
      throw new Error("Funcionário não encontrado");
    }

    const currentSales = employee.sales || [];
    if (!currentSales.includes(orderId)) {
      const updatedSales = [...currentSales, orderId];
      await this.userRepository.update(employeeId, { sales: updatedSales });
    }
  }

  /**
   * Atualiza o campo purchases do cliente após criar um pedido
   * @param clientId ID do cliente
   * @param orderId ID do pedido
   */
  async updateCustomerPurchases(clientId: string, orderId: string): Promise<void> {
    const customer = await this.userRepository.findById(clientId);
    if (!customer) {
      throw new Error("Cliente não encontrado");
    }

    const currentPurchases = customer.purchases || [];
    if (!currentPurchases.includes(orderId)) {
      const updatedPurchases = [...currentPurchases, orderId];
      await this.userRepository.update(clientId, { purchases: updatedPurchases });
    }
  }

  /**
   * Atualiza os débitos do cliente após criar um pedido
   * @param clientId ID do cliente
   * @param orderData Dados do pedido
   */
  async updateCustomerDebts(clientId: string, orderData: Omit<IOrder, "_id">): Promise<void> {
    // Se há um responsável, atualizar débitos do responsável em vez do cliente
    const responsibleId = orderData.responsibleClientId;
    const targetClientId = responsibleId ? (typeof responsibleId === 'string' ? responsibleId : responsibleId.toString()) : clientId;
    
    const finalPrice = orderData.totalPrice - (orderData.discount || 0);
    const entryAmount = orderData.paymentEntry || 0;
    const remainingAmount = finalPrice - entryAmount;

    if (remainingAmount > 0) {
      // Verificar se o cliente é um cliente regular ou legado
      const regularClient = await this.userRepository.findById(targetClientId);
      
      if (regularClient) {
        // Cliente regular
        const currentDebt = regularClient.debts || 0;
        const newDebt = currentDebt + remainingAmount;
        await this.userRepository.update(targetClientId, { debts: newDebt });
      } else {
        // Verificar se é um cliente legado
        const legacyClient = await this.legacyClientRepository.findById(targetClientId);
        if (legacyClient) {
          const currentDebt = legacyClient.totalDebt || 0;
          const newDebt = currentDebt + remainingAmount;
          await this.legacyClientRepository.update(targetClientId, { totalDebt: newDebt });
        }
      }
    }
  }

  /**
   * Remove um pedido das vendas de um funcionário
   * @param employeeId ID do funcionário
   * @param orderId ID do pedido
   */
  async removeOrderFromEmployeeSales(employeeId: string, orderId: string): Promise<void> {
    const employee = await this.userRepository.findById(employeeId);
    if (!employee || !employee.sales) return;

    const updatedSales = employee.sales.filter(sale => sale !== orderId);
    await this.userRepository.update(employeeId, { sales: updatedSales });
  }

  /**
   * Remove um pedido das compras de um cliente
   * @param clientId ID do cliente
   * @param orderId ID do pedido
   */
  async removeOrderFromCustomerPurchases(clientId: string, orderId: string): Promise<void> {
    const customer = await this.userRepository.findById(clientId);
    if (!customer || !customer.purchases) return;

    const updatedPurchases = customer.purchases.filter(purchase => purchase !== orderId);
    await this.userRepository.update(clientId, { purchases: updatedPurchases });
  }

  /**
   * Reverte os débitos de um cliente quando um pedido é cancelado
   * @param clientId ID do cliente
   * @param orderData Dados do pedido
   */
  async revertCustomerDebts(clientId: string, orderData: IOrder): Promise<void> {
    // Se há um responsável, reverter débitos do responsável em vez do cliente
    const responsibleId = orderData.responsibleClientId;
    const targetClientId = responsibleId ? (typeof responsibleId === 'string' ? responsibleId : responsibleId.toString()) : clientId;
    
    const finalPrice = orderData.totalPrice - (orderData.discount || 0);
    const entryAmount = orderData.paymentEntry || 0;
    const remainingAmount = finalPrice - entryAmount;

    if (remainingAmount > 0) {
      // Verificar se o cliente é um cliente regular ou legado
      const regularClient = await this.userRepository.findById(targetClientId);
      
      if (regularClient) {
        // Cliente regular
        const currentDebt = regularClient.debts || 0;
        const newDebt = Math.max(0, currentDebt - remainingAmount);
        await this.userRepository.update(targetClientId, { debts: newDebt });
      } else {
        // Verificar se é um cliente legado
        const legacyClient = await this.legacyClientRepository.findById(targetClientId);
        if (legacyClient) {
          const currentDebt = legacyClient.totalDebt || 0;
          const newDebt = Math.max(0, currentDebt - remainingAmount);
          await this.legacyClientRepository.update(targetClientId, { totalDebt: newDebt });
        }
      }
    }
  }

  /**
   * Atualiza todos os relacionamentos após criar um pedido
   * @param orderData Dados do pedido
   * @param orderId ID do pedido criado
   */
  async updateOrderRelationships(orderData: Omit<IOrder, "_id">, orderId: string): Promise<void> {
    const employeeId = typeof orderData.employeeId === 'string' ? orderData.employeeId : orderData.employeeId.toString();
    const clientId = typeof orderData.clientId === 'string' ? orderData.clientId : orderData.clientId.toString();
    
    await Promise.all([
      this.updateEmployeeSales(employeeId, orderId),
      this.updateCustomerPurchases(clientId, orderId),
      this.updateCustomerDebts(clientId, orderData)
    ]);
  }

  /**
   * Remove todos os relacionamentos quando um pedido é cancelado
   * @param order Dados do pedido
   */
  async removeOrderRelationships(order: IOrder): Promise<void> {
    const employeeId = typeof order.employeeId === 'string' ? order.employeeId : order.employeeId.toString();
    const clientId = typeof order.clientId === 'string' ? order.clientId : order.clientId.toString();
    
    await Promise.all([
      this.removeOrderFromEmployeeSales(employeeId, order._id!),
      this.removeOrderFromCustomerPurchases(clientId, order._id!),
      this.revertCustomerDebts(clientId, order)
    ]);
  }

  /**
   * Recalcula débitos de um cliente específico
   * @param clientId ID do cliente
   * @returns Novo valor do débito
   */
  async recalculateClientDebt(clientId: string): Promise<number> {
    // Primeiro, tentar buscar como cliente regular
    const regularClient = await this.userRepository.findById(clientId);
    
    if (regularClient) {
      // Lógica para recalcular débito do cliente regular
      // Isso poderia envolver buscar todos os pedidos pendentes, pagamentos, etc.
      // Por simplicidade, retornando o débito atual
      return regularClient.debts || 0;
    }

    // Se não for cliente regular, tentar como cliente legado
    const legacyClient = await this.legacyClientRepository.findById(clientId);
    if (legacyClient) {
      return legacyClient.totalDebt || 0;
    }

    return 0;
  }

  /**
   * Transfere débito entre clientes
   * @param fromClientId ID do cliente origem
   * @param toClientId ID do cliente destino
   * @param amount Valor a transferir
   */
  async transferDebt(fromClientId: string, toClientId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      throw new Error("Valor de transferência deve ser positivo");
    }

    // Buscar clientes de origem e destino
    const fromClient = await this.userRepository.findById(fromClientId);
    const toClient = await this.userRepository.findById(toClientId);

    // Verificar se ambos os clientes existem
    if (!fromClient) {
      throw new Error("Cliente de origem não encontrado");
    }
    if (!toClient) {
      throw new Error("Cliente de destino não encontrado");
    }

    // Verificar se o cliente de origem tem débito suficiente
    const fromDebt = fromClient.debts || 0;
    if (fromDebt < amount) {
      throw new Error("Cliente de origem não possui débito suficiente");
    }

    // Realizar a transferência
    const newFromDebt = fromDebt - amount;
    const newToDebt = (toClient.debts || 0) + amount;

    await Promise.all([
      this.userRepository.update(fromClientId, { debts: newFromDebt }),
      this.userRepository.update(toClientId, { debts: newToDebt })
    ]);
  }
} 