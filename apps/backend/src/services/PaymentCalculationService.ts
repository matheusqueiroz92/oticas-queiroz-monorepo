import { getRepositories } from "../repositories/RepositoryFactory";
import type { IPayment } from "../interfaces/IPayment";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import type { ILegacyClientRepository } from "../repositories/interfaces/ILegacyClientRepository";
import type { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";
import type { IOrderRepository } from "../repositories/interfaces/IOrderRepository";

export class PaymentCalculationService {
  private userRepository: IUserRepository;
  private legacyClientRepository: ILegacyClientRepository;
  private paymentRepository: IPaymentRepository;
  private orderRepository: IOrderRepository;

  constructor() {
    const { userRepository, legacyClientRepository, paymentRepository, orderRepository } = getRepositories();
    this.userRepository = userRepository;
    this.legacyClientRepository = legacyClientRepository;
    this.paymentRepository = paymentRepository;
    this.orderRepository = orderRepository;
  }

  /**
   * Calcula o débito total de um cliente com base em seus pedidos
   * @param clientId ID do cliente
   * @returns Total de débito do cliente
   */
  async calculateClientTotalDebt(clientId: string): Promise<number> {
    try {
      // Verificar se o cliente existe
      const client = await this.userRepository.findById(clientId);
      if (!client) {
        console.error(`Cliente ${clientId} não encontrado ao calcular débito total`);
        return 0;
      }
      
      // Buscar todos os pedidos ativos (não cancelados) do cliente
      const clientOrders = await this.orderRepository.findByClientId(clientId);
      
      // Filtrar pedidos cancelados
      const activeOrders = clientOrders.filter(order => order.status !== 'cancelled');
      
      // Calcular o débito total do cliente com base em seus pedidos
      let totalDebt = 0;
      
      for (const order of activeOrders) {
        // Calcular o valor total devedor do pedido (finalPrice)
        const orderTotal = order.finalPrice;
        
        // Calcular quanto já foi pago neste pedido (inclui a entrada)
        const orderPaid = order.paymentHistory 
          ? order.paymentHistory.reduce((sum, entry) => sum + entry.amount, 0) 
          : 0;
        
        // Se ainda houver valor a pagar, adicionar ao débito total
        if (orderPaid < orderTotal) {
          totalDebt += (orderTotal - orderPaid);
        }
      }
      
  
      return totalDebt;
    } catch (error) {
      console.error(`Erro ao calcular débito total do cliente ${clientId}:`, error);
      return 0;
    }
  }

  /**
   * Recalcula os débitos de todos os clientes ou de um cliente específico
   * @param clientId ID opcional do cliente específico
   * @returns Objeto com informações sobre os ajustes realizados
   */
  async recalculateClientDebts(clientId?: string): Promise<{
    updated: number;
    clients: Array<{ id: string; oldDebt: number; newDebt: number; diff: number }>;
  }> {
    try {
      const result = {
        updated: 0,
        clients: [] as Array<{ id: string; oldDebt: number; newDebt: number; diff: number }>
      };

      // Se um clientId foi fornecido, recalcular apenas para esse cliente
      if (clientId) {
        const client = await this.userRepository.findById(clientId);
        if (!client) {
          throw new Error("Cliente não encontrado");
        }

        const oldDebt = client.debts || 0;
        const newDebt = await this.calculateClientTotalDebt(clientId);
        
        // Se houver diferença, atualizar o débito do cliente
        if (newDebt !== oldDebt) {
          await this.userRepository.update(clientId, {
            debts: newDebt
          });
          
          result.updated = 1;
          result.clients.push({
            id: clientId,
            oldDebt,
            newDebt,
            diff: newDebt - oldDebt
          });
        }
        
        return result;
      }
      
      // Caso contrário, buscar todos os clientes
      const { items: users } = await this.userRepository.findAll(1, 1000, { role: 'customer' });
      
      // Para cada cliente, recalcular o débito total
      for (const client of users) {
        const oldDebt = client.debts || 0;
        const newDebt = await this.calculateClientTotalDebt(client._id);
        
        // Se houver diferença, atualizar o débito do cliente
        if (newDebt !== oldDebt) {
          await this.userRepository.update(client._id, {
            debts: newDebt
          });
          
          result.updated++;
          result.clients.push({
            id: client._id,
            oldDebt,
            newDebt,
            diff: newDebt - oldDebt
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Erro ao recalcular débitos de clientes:", error);
      throw error;
    }
  }

  /**
   * Atualiza o débito de um cliente
   * @param customerId ID do cliente
   * @param legacyClientId ID do cliente legado
   * @param debtAmount Valor do débito
   * @param paymentId ID do pagamento
   * @param institutionId ID da instituição
   */
  async updateClientDebt(
    customerId?: string,
    legacyClientId?: string,
    debtAmount?: number,
    paymentId?: string,
    institutionId?: string
  ): Promise<void> {
    if (!debtAmount || debtAmount <= 0) return;

    if (customerId) {
      const user = await this.userRepository.findById(customerId);
      if (user) {
        const newDebt = (user.debts || 0) + debtAmount;
        await this.userRepository.update(customerId, { 
          debts: newDebt
        });
      }
    } else if (legacyClientId) {
      const legacyClient = await this.legacyClientRepository.findById(legacyClientId);
      if (legacyClient) {
        const newDebt = (legacyClient.totalDebt || 0) + debtAmount;
        await this.legacyClientRepository.update(legacyClientId, { 
          totalDebt: newDebt
        });
      }
    }
  }

  /**
   * Calcula o resumo de status de pagamento de um pedido
   * @param orderId ID do pedido
   * @returns Resumo do status de pagamento
   */
  async calculatePaymentStatusSummary(orderId: string): Promise<{
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    status: "paid" | "pending" | "partial";
    payments: IPayment[];
  }> {
    const { items: payments } = await this.paymentRepository.findAll(1, 1000, { orderId });
    
    const totalAmount = payments.reduce((sum: number, payment: IPayment) => sum + payment.amount, 0);
    const paidAmount = payments
      .filter((p: IPayment) => p.status === "completed")
      .reduce((sum: number, payment: IPayment) => sum + payment.amount, 0);
    const pendingAmount = totalAmount - paidAmount;

    let status: "paid" | "pending" | "partial" = "pending";
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    }

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      status,
      payments
    };
  }

  /**
   * Calcula os totais por método de pagamento
   * @param payments Lista de pagamentos
   * @returns Totais por método de pagamento
   */
  calculatePaymentMethodTotals(payments: IPayment[]): {
    totalByCreditCard: number;
    totalByDebitCard: number;
    totalByCash: number;
    totalByPix: number;
    totalByCheck: number;
    totalByBankSlip: number;
    totalByPromissoryNote: number;
  } {
    const totals = {
      totalByCreditCard: 0,
      totalByDebitCard: 0,
      totalByCash: 0,
      totalByPix: 0,
      totalByCheck: 0,
      totalByBankSlip: 0,
      totalByPromissoryNote: 0
    };

    payments.forEach((payment: IPayment) => {
      switch (payment.paymentMethod) {
        case 'credit':
          totals.totalByCreditCard += payment.amount;
          break;
        case 'debit':
          totals.totalByDebitCard += payment.amount;
          break;
        case 'cash':
          totals.totalByCash += payment.amount;
          break;
        case 'pix':
          totals.totalByPix += payment.amount;
          break;
        case 'check':
          totals.totalByCheck += payment.amount;
          break;
        case 'bank_slip':
          totals.totalByBankSlip += payment.amount;
          break;
        case 'promissory_note':
          totals.totalByPromissoryNote += payment.amount;
          break;
      }
    });

    return totals;
  }

  /**
   * Calcula os totais por tipo de pagamento
   * @param payments Lista de pagamentos
   * @returns Totais por tipo de pagamento
   */
  calculatePaymentTypeTotals(payments: IPayment[]): {
    totalSales: number;
    totalDebtPayments: number;
    totalExpenses: number;
  } {
    const totals = {
      totalSales: 0,
      totalDebtPayments: 0,
      totalExpenses: 0
    };

    payments.forEach((payment: IPayment) => {
      switch (payment.type) {
        case 'sale':
          totals.totalSales += payment.amount;
          break;
        case 'debt_payment':
          totals.totalDebtPayments += payment.amount;
          break;
        case 'expense':
          totals.totalExpenses += payment.amount;
          break;
      }
    });

    return totals;
  }
} 