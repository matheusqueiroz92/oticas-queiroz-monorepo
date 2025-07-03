import { RepositoryFactory } from "../repositories/RepositoryFactory";
import type { ICashRegisterRepository } from "../repositories/interfaces/ICashRegisterRepository";
import type { IOrderRepository } from "../repositories/interfaces/IOrderRepository";
import type { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";
import type { IPayment } from "../interfaces/IPayment";
import type { IOrder } from "../interfaces/IOrder";

export class PaymentStatusService {
  private cashRegisterRepository: ICashRegisterRepository;
  private orderRepository: IOrderRepository;
  private paymentRepository: IPaymentRepository;

  constructor() {
    const factory = RepositoryFactory.getInstance();
    this.cashRegisterRepository = factory.getCashRegisterRepository();
    this.orderRepository = factory.getOrderRepository();
    this.paymentRepository = factory.getPaymentRepository();
  }

  /**
   * Atualiza o caixa com o pagamento
   * @param cashRegisterId ID do caixa
   * @param payment Dados do pagamento
   */
  async updateCashRegister(cashRegisterId: string, payment: IPayment): Promise<void> {
    const cashRegister = await this.cashRegisterRepository.findById(cashRegisterId);
    if (!cashRegister) {
      throw new Error("Caixa não encontrado");
    }

    // Atualizar vendas no caixa por método
    const updatedSales = { ...cashRegister.sales };
    updatedSales.total = (updatedSales.total || 0) + payment.amount;

    switch (payment.paymentMethod) {
      case "cash":
        updatedSales.cash = (updatedSales.cash || 0) + payment.amount;
        break;
      case "credit":
        updatedSales.credit = (updatedSales.credit || 0) + payment.amount;
        break;
      case "debit":
        updatedSales.debit = (updatedSales.debit || 0) + payment.amount;
        break;
      case "pix":
        updatedSales.pix = (updatedSales.pix || 0) + payment.amount;
        break;
      case "check":
        updatedSales.check = (updatedSales.check || 0) + payment.amount;
        break;
    }

    await this.cashRegisterRepository.updateSales(cashRegisterId, updatedSales);

    // Atualizar pagamentos recebidos
    if (payment.type === "sale" || payment.type === "debt_payment") {
      const updatedPayments = { ...cashRegister.payments };
      updatedPayments.received = (updatedPayments.received || 0) + payment.amount;
      await this.cashRegisterRepository.updatePayments(cashRegisterId, updatedPayments);
    }
  }

  /**
   * Atualiza o status de pagamento de um pedido
   * @param orderId ID do pedido
   * @param paymentId ID do pagamento
   * @param amount Valor do pagamento
   * @param method Método de pagamento
   * @param action Ação a ser realizada
   */
  async updateOrderPaymentStatus(
    orderId: string,
    paymentId?: string,
    amount?: number,
    method?: string,
    action: 'add' | 'remove' | 'recalculate' = 'recalculate'
  ): Promise<void> {
    console.log(`[PaymentStatusService] Iniciando atualização para pedido ${orderId}`);
    
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      console.error(`[PaymentStatusService] Pedido ${orderId} não encontrado`);
      throw new Error("Pedido não encontrado");
    }

    // Calcular o valor final considerando desconto
    const finalPrice = order.finalPrice || (order.totalPrice - (order.discount || 0));
    
    console.log(`[PaymentStatusService] Pedido encontrado: ${order._id}`);
    console.log(`[PaymentStatusService] Valores: totalPrice=${order.totalPrice}, discount=${order.discount || 0}, finalPrice=${finalPrice}`);

    // Buscar todos os pagamentos do pedido
    // Garantir que o orderId seja comparado corretamente (como string ou ObjectId)
    const { items: payments } = await this.paymentRepository.findAll(1, 1000, { orderId: orderId });
    
    console.log(`[PaymentStatusService] Encontrados ${payments.length} pagamentos para o pedido ${orderId}`);
    payments.forEach((p, index) => {
      console.log(`[PaymentStatusService] Pagamento ${index + 1}: ID=${p._id}, status=${p.status}, valor=${p.amount}`);
    });
    
    // Calcular totais
    const totalPaid = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    console.log(`[PaymentStatusService] Total pago (apenas completed): ${totalPaid} de ${finalPrice} (valor final)`);

    // Determinar status do pagamento - CORRIGIDO: usar finalPrice ao invés de totalPrice
    let paymentStatus: IOrder["paymentStatus"] = "pending";
    if (totalPaid >= finalPrice) {
      paymentStatus = "paid";
    } else if (totalPaid > 0) {
      paymentStatus = "partially_paid";
    }

    console.log(`[PaymentStatusService] Novo status calculado: ${paymentStatus}`);

    // Atualizar o pedido com o novo status de pagamento
    const updates: Partial<IOrder> = { paymentStatus };

    // Adicionar histórico de pagamento se há um novo pagamento
    if (paymentId && amount && method) {
      const currentHistory = order.paymentHistory || [];
      const newEntry = {
        paymentId,
        amount,
        date: new Date(),
        method,
      };
      updates.paymentHistory = [...currentHistory, newEntry];
      console.log(`[PaymentStatusService] Adicionado ao histórico: pagamento ${paymentId}, valor ${amount}`);
    }

    console.log(`[PaymentStatusService] Atualizando pedido com:`, updates);
    await this.orderRepository.update(orderId, updates);
    console.log(`[PaymentStatusService] Pedido ${orderId} atualizado com sucesso`);
  }

  /**
   * Recalcula o status de pagamento de um pedido
   * @param orderId ID do pedido
   * @param customerId ID do cliente (opcional)
   */
  async recalculateOrderPaymentStatus(orderId: string, customerId?: string): Promise<void> {
    await this.updateOrderPaymentStatus(orderId, undefined, undefined, undefined, 'recalculate');
  }

  /**
   * Atualiza o status de compensação de cheque
   * @param paymentId ID do pagamento
   * @param status Status da compensação
   * @param rejectionReason Motivo da rejeição (se aplicável)
   */
  async updateCheckCompensationStatus(
    paymentId: string,
    status: "pending" | "compensated" | "rejected",
    rejectionReason?: string
  ): Promise<IPayment | null> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment || payment.paymentMethod !== "check") {
      throw new Error("Pagamento não encontrado ou não é um cheque");
    }

    const updates: Partial<IPayment> = {};

    if (status === "compensated") {
      updates.status = "completed";
    } else if (status === "rejected") {
      updates.status = "cancelled";
    }

    // Adicionar informações específicas do cheque se necessário
    if (rejectionReason) {
      updates.description = `${payment.description || ''} - Rejeitado: ${rejectionReason}`;
    }

    return await this.paymentRepository.update(paymentId, updates);
  }

  /**
   * Busca cheques por status de compensação
   * @param status Status de compensação
   * @param startDate Data de início (opcional)
   * @param endDate Data de fim (opcional)
   */
  async getChecksByStatus(
    status: "pending" | "compensated" | "rejected",
    startDate?: Date,
    endDate?: Date
  ): Promise<IPayment[]> {
    const filters: any = {
      paymentMethod: "check",
    };

    // Mapear status para os status de pagamento
    if (status === "compensated") {
      filters.status = "completed";
    } else if (status === "rejected") {
      filters.status = "cancelled";
    } else {
      filters.status = "pending";
    }

    const { items } = await this.paymentRepository.findAll(1, 1000, filters);
    
    // Filtrar por data se fornecida
    if (startDate || endDate) {
      return items.filter(payment => {
        const paymentDate = payment.createdAt;
        if (!paymentDate) return false;
        if (startDate && paymentDate < startDate) return false;
        if (endDate && paymentDate > endDate) return false;
        return true;
      });
    }

    return items;
  }

  /**
   * Cancela um pagamento e reverte as alterações
   * @param paymentId ID do pagamento
   * @param userId ID do usuário que está cancelando
   */
  async cancelPayment(paymentId: string, userId: string): Promise<IPayment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error("Pagamento não encontrado");
    }

    if (payment.status === "cancelled") {
      throw new Error("Pagamento já foi cancelado");
    }

    // Reverter alterações no caixa se houver cashRegisterId
    if (payment.cashRegisterId) {
      await this.revertCashRegisterChanges(payment.cashRegisterId.toString(), payment);
    }

    // Cancelar o pagamento
    const cancelledPayment = await this.paymentRepository.update(paymentId, { 
      status: "cancelled" as const,
      description: `${payment.description || ''} - Cancelado por usuário ${userId}`,
    });

    if (!cancelledPayment) {
      throw new Error("Erro ao cancelar pagamento");
    }

    // Recalcular status do pedido se houver orderId
    if (payment.orderId) {
      await this.recalculateOrderPaymentStatus(payment.orderId.toString());
    }

    return cancelledPayment;
  }

  /**
   * Reverte as alterações no caixa causadas por um pagamento
   * @param cashRegisterId ID do caixa
   * @param payment Dados do pagamento
   */
  private async revertCashRegisterChanges(cashRegisterId: string, payment: IPayment): Promise<void> {
    const cashRegister = await this.cashRegisterRepository.findById(cashRegisterId);
    if (!cashRegister) {
      throw new Error("Caixa não encontrado");
    }

    // Reverter vendas no caixa por método de pagamento específico
    if (payment.type === "sale") {
      const updatedSales = { ...cashRegister.sales };
      
      // Atualizar total de vendas
      updatedSales.total = Math.max(0, (updatedSales.total || 0) - payment.amount);
      
      // Atualizar por método de pagamento específico
      switch (payment.paymentMethod) {
        case "cash":
          updatedSales.cash = Math.max(0, (updatedSales.cash || 0) - payment.amount);
          break;
        case "credit":
          updatedSales.credit = Math.max(0, (updatedSales.credit || 0) - payment.amount);
          break;
        case "debit":
          updatedSales.debit = Math.max(0, (updatedSales.debit || 0) - payment.amount);
          break;
        case "pix":
          updatedSales.pix = Math.max(0, (updatedSales.pix || 0) - payment.amount);
          break;
        case "check":
          updatedSales.check = Math.max(0, (updatedSales.check || 0) - payment.amount);
          break;
      }
      
      await this.cashRegisterRepository.updateSales(cashRegisterId, updatedSales);
    }

    // Atualizar pagamentos recebidos/feitos
    const updatedPayments = { ...cashRegister.payments };
    if (payment.type === "sale" || payment.type === "debt_payment") {
      updatedPayments.received = Math.max(0, (updatedPayments.received || 0) - payment.amount);
    } else if (payment.type === "expense") {
      updatedPayments.made = Math.max(0, (updatedPayments.made || 0) - payment.amount);
    }

    await this.cashRegisterRepository.updatePayments(cashRegisterId, updatedPayments);
  }
} 