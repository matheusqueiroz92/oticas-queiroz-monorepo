import { RepositoryFactory } from "../repositories/RepositoryFactory";
import { PaymentValidationService, PaymentValidationError } from "./PaymentValidationService";
import { PaymentCalculationService } from "./PaymentCalculationService";
import { PaymentExportService } from "./PaymentExportService";
import type { IPayment, CreatePaymentDTO } from "../interfaces/IPayment";
import type { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";
import NodeCache from "node-cache";
import { ExportUtils, type ExportOptions } from "../utils/exportUtils";

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

interface DateRangeQuery {
  $gte: Date;
  $lte: Date;
}

interface FinancialReportData {
  date: string;
  totalSales: number;
  totalDebtPayments: number;
  totalExpenses: number;
  dailyBalance: number;
  totalByCreditCard: number;
  totalByDebitCard: number;
  totalByCash: number;
  totalByPix: number;
  payments: IPayment[];
}

export class PaymentService {
  private paymentRepository: IPaymentRepository;
  private validationService: PaymentValidationService;
  private calculationService: PaymentCalculationService;
  private exportService: PaymentExportService;
  private cache: NodeCache;

  constructor() {
    const repositories = RepositoryFactory.getInstance();
    this.paymentRepository = repositories.getPaymentRepository();
    this.validationService = new PaymentValidationService();
    this.calculationService = new PaymentCalculationService();
    this.exportService = new PaymentExportService();
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  /**
   * Invalida cache quando houver alterações
   * @param keys Chaves do cache para invalidar
   */
  private invalidateCache(keys: string | string[]): void {
    if (Array.isArray(keys)) {
      for (const key of keys) {
        this.cache.del(key);
      }
    } else {
      this.cache.del(keys);
    }
  }

  /**
   * Cria um novo pagamento
   * @param paymentData Dados do pagamento
   * @returns Pagamento criado
   */
  async createPayment(paymentData: Omit<IPayment, "_id">): Promise<IPayment> {
    try {
      // Validar pagamento
      const cashRegisterId = await this.validationService.validatePayment(paymentData as CreatePaymentDTO);

      // Normalizar método de pagamento
      const normalizedMethod = this.validationService.normalizePaymentMethod(paymentData.paymentMethod);

      // Determinar status do pagamento:
      // - Para vendas com métodos instantâneos (cash, pix, debit, credit) = "completed"
      // - Para métodos que precisam validação (check, bank_slip, promissory_note) = "pending"
      let paymentStatus = paymentData.status || "pending";
      
      if (paymentData.type === "sale" && 
          ["cash", "pix", "debit", "credit", "mercado_pago"].includes(paymentData.paymentMethod)) {
        paymentStatus = "completed";
      }

      // Criar pagamento
      const payment = await this.paymentRepository.create({
        ...paymentData,
        paymentMethod: normalizedMethod as any,
        cashRegisterId,
        date: paymentData.date || new Date(),
        status: paymentStatus
      });

      // Se há um pedido associado, atualizar o status de pagamento do pedido
      if (payment.orderId && payment._id) {
        try {
          console.log(`[PaymentService] Atualizando status do pedido ${payment.orderId} com pagamento ${payment._id}`);
          console.log(`[PaymentService] Pagamento criado com status: ${payment.status}`);
          console.log(`[PaymentService] Valor do pagamento: ${payment.amount}`);
          
          const { PaymentStatusService } = await import('./PaymentStatusService');
          const paymentStatusService = new PaymentStatusService();
          
          await paymentStatusService.updateOrderPaymentStatus(
            payment.orderId.toString(),
            payment._id.toString(),
            payment.amount,
            payment.paymentMethod,
            'add'
          );
          
          console.log(`[PaymentService] Status do pedido ${payment.orderId} atualizado com sucesso`);
        } catch (error) {
          console.error('Erro ao atualizar status do pedido:', error);
          // Não vamos falhar o pagamento por causa disso, apenas logar o erro
        }
      }

      // Invalidar cache completamente
      this.cache.flushAll(); // Limpar todo o cache para garantir dados frescos
      
      console.log(`[PaymentService] Cache invalidado após criação do pagamento ${payment._id}`);

      return payment;
    } catch (error) {
      if (error instanceof PaymentValidationError) {
        throw new PaymentError(error.message);
      }
      throw error;
    }
  }

  /**
   * Busca pagamento por ID
   * @param id ID do pagamento
   * @returns Pagamento encontrado
   */
  async getPaymentById(id: string): Promise<IPayment> {
    const cacheKey = `payment_${id}`;
    let payment = this.cache.get<IPayment>(cacheKey);

    if (!payment) {
      const foundPayment = await this.paymentRepository.findById(id);
      if (!foundPayment) {
        throw new PaymentError("Pagamento não encontrado");
      }
      payment = foundPayment;
      this.cache.set(cacheKey, payment);
    }

    return payment;
  }

  /**
   * Busca todos os pagamentos com paginação
   * @param page Página
   * @param limit Limite por página
   * @param filters Filtros de busca
   * @returns Lista paginada de pagamentos
   */
  async getAllPayments(
    page?: number,
    limit?: number,
    filters: Partial<IPayment> = {}
  ): Promise<{ payments: IPayment[]; total: number }> {
    const actualPage = page || 1;
    const actualLimit = limit || 10;
    
    const cacheKey = `payments_${actualPage}_${actualLimit}_${JSON.stringify(filters)}`;
    let result = this.cache.get<{ payments: IPayment[]; total: number }>(cacheKey);

    if (!result) {
      const repositoryResult = await this.paymentRepository.findAll(actualPage, actualLimit, filters);
      result = {
        payments: repositoryResult.items,
        total: repositoryResult.total
      };
      this.cache.set(cacheKey, result, 300); // Cache por 5 minutos
    }

    return result;
  }

  /**
   * Busca pagamentos diários
   * @param date Data para busca
   * @param type Tipo de pagamento (opcional)
   * @returns Lista de pagamentos do dia
   */
  async getDailyPayments(
    date: Date,
    type?: IPayment["type"]
  ): Promise<IPayment[]> {
    const dateString = date.toDateString();
    const cacheKey = `daily_payments_${dateString}_${type || 'all'}`;
    
    let payments = this.cache.get<IPayment[]>(cacheKey);

    if (!payments) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const filters: Record<string, any> = {
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      };

      if (type) {
        filters.type = type;
      }

      const repositoryResult = await this.paymentRepository.findAll(1, 1000, filters);
      payments = repositoryResult.items;
      this.cache.set(cacheKey, payments, 300);
    }

    return payments;
  }

  /**
   * Cancela um pagamento
   * @param id ID do pagamento
   * @param userId ID do usuário que está cancelando
   * @returns Pagamento cancelado
   */
  async cancelPayment(id: string, userId: string): Promise<IPayment> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new PaymentError("Pagamento não encontrado");
    }

    if (payment.status === "cancelled") {
      throw new PaymentError("Pagamento já foi cancelado");
    }

    const cancelledPayment = await this.paymentRepository.update(id, {
      status: "cancelled"
    });

    if (!cancelledPayment) {
      throw new PaymentError("Erro ao cancelar pagamento");
    }

    // Invalidar cache
    this.invalidateCache([
      `payment_${id}`,
      `payments_${new Date().toDateString()}`,
      "payments_all"
    ]);

    return cancelledPayment;
  }

  /**
   * Soft delete de um pagamento
   * @param id ID do pagamento
   * @param userId ID do usuário que está excluindo
   * @returns Pagamento excluído
   */
  async softDeletePayment(id: string, userId: string): Promise<IPayment> {
    const payment = await this.paymentRepository.softDelete(id, userId);
    if (!payment) {
      throw new PaymentError("Erro ao excluir pagamento");
    }

    // Invalidar cache
    this.invalidateCache([
      `payment_${id}`,
      `payments_${new Date().toDateString()}`,
      "payments_all"
    ]);

    return payment;
  }

  /**
   * Busca pagamentos excluídos
   * @param page Página
   * @param limit Limite por página
   * @param filters Filtros de busca
   * @returns Lista paginada de pagamentos excluídos
   */
  async getDeletedPayments(
    page?: number,
    limit?: number,
    filters: Partial<IPayment> = {}
  ): Promise<{ payments: IPayment[]; total: number }> {
    const actualPage = page || 1;
    const actualLimit = limit || 10;

    const deletedFilters = { ...filters, isDeleted: true };
    const repositoryResult = await this.paymentRepository.findAll(actualPage, actualLimit, deletedFilters);
    
    return {
      payments: repositoryResult.items,
      total: repositoryResult.total
    };
  }

  /**
   * Exporta pagamentos
   * @param options Opções de exportação
   * @param filters Filtros de busca
   * @returns Buffer do arquivo exportado
   */
  async exportPayments(
    options: ExportOptions,
    filters: Partial<IPayment> = {}
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    return await this.exportService.exportPayments(options, filters);
  }

  /**
   * Exporta relatório financeiro
   * @param reportData Dados do relatório
   * @param options Opções de exportação
   * @returns Buffer do arquivo exportado
   */
  async exportFinancialReport(
    reportData: FinancialReportData,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    return await this.exportService.exportFinancialReport(reportData, options);
  }

  /**
   * Atualiza status de compensação de cheque
   * @param id ID do pagamento
   * @param status Novo status
   * @param rejectionReason Motivo de rejeição (se aplicável)
   * @returns Pagamento atualizado
   */
  async updateCheckCompensationStatus(
    id: string,
    status: "pending" | "compensated" | "rejected",
    rejectionReason?: string
  ): Promise<IPayment> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new PaymentError("Pagamento não encontrado");
    }

    if (payment.paymentMethod !== "check") {
      throw new PaymentError("Este pagamento não é um cheque");
    }

    // Mapear status para os valores válidos da interface IPayment
    let paymentStatus: "pending" | "completed" | "cancelled";
    if (status === "compensated") {
      paymentStatus = "completed";
    } else if (status === "rejected") {
      paymentStatus = "cancelled";
    } else {
      paymentStatus = "pending";
    }

    const updateData: Partial<IPayment> = {
      status: paymentStatus,
      // Atualizar informações do cheque
      check: {
        ...payment.check!,
        compensationStatus: status,
        ...(rejectionReason && { rejectionReason })
      }
    };

    const updatedPayment = await this.paymentRepository.update(id, updateData);
    if (!updatedPayment) {
      throw new PaymentError("Erro ao atualizar status do cheque");
    }

    // Invalidar cache
    this.invalidateCache([`payment_${id}`, "payments_all"]);

    return updatedPayment;
  }

  /**
   * Busca cheques por status
   * @param status Status dos cheques
   * @param startDate Data de início (opcional)
   * @param endDate Data de fim (opcional)
   * @returns Lista de cheques
   */
  async getChecksByStatus(
    status: "pending" | "compensated" | "rejected",
    startDate?: Date,
    endDate?: Date
  ): Promise<IPayment[]> {
    const filters: Record<string, any> = {
      paymentMethod: "check",
      "check.compensationStatus": status
    };

    if (startDate && endDate) {
      filters.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const repositoryResult = await this.paymentRepository.findAll(1, 1000, filters);
    return repositoryResult.items;
  }

  /**
   * Recalcula dívidas de clientes
   * @param clientId ID do cliente (opcional, se não informado recalcula todos)
   * @returns Resumo da operação
   */
  async recalculateClientDebts(clientId?: string): Promise<{
    updated: number;
    clients: Array<{ id: string; oldDebt: number; newDebt: number; diff: number }>;
  }> {
    // Esta funcionalidade seria implementada em colaboração com OrderService/ClientService
    // Por ora, retornamos um mock
    return {
      updated: 0,
      clients: []
    };
  }

  /**
   * Calcula resumo de status de pagamento de um pedido
   * @param orderId ID do pedido
   * @returns Resumo do status de pagamento
   */
  async getPaymentStatusSummary(orderId: string): Promise<{
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    status: "paid" | "pending" | "partial";
    payments: IPayment[];
  }> {
    const repositoryResult = await this.paymentRepository.findAll(1, 1000, { orderId });
    const payments = repositoryResult.items;

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingAmount = totalAmount - paidAmount;
    
    let status: "paid" | "pending" | "partial" = "pending";
    if (paidAmount >= totalAmount) {
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
} 