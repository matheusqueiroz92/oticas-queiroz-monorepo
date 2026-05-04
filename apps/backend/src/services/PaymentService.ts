import { RepositoryFactory } from "../repositories/RepositoryFactory";
import { PaymentValidationService, PaymentValidationError } from "./PaymentValidationService";
import { PaymentCalculationService } from "./PaymentCalculationService";
import { PaymentExportService } from "./PaymentExportService";
import { SicrediService } from "./SicrediService";
import { PaymentStatusService } from "./PaymentStatusService";
import type { IPayment, CreatePaymentDTO } from "../interfaces/IPayment";
import type { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";
import NodeCache from "node-cache";
import { ExportUtils, type ExportOptions } from "../utils/exportUtils";
import { withTransaction } from "../utils/withTransaction";
import { logger } from "../config/logger";

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
  private sicrediService: SicrediService;
  private cache: NodeCache;

  private paymentStatusService: PaymentStatusService;

  constructor() {
    const repositories = RepositoryFactory.getInstance();
    this.paymentRepository = repositories.getPaymentRepository();
    this.validationService = new PaymentValidationService();
    this.calculationService = new PaymentCalculationService();
    this.exportService = new PaymentExportService();
    this.sicrediService = new SicrediService();
    this.paymentStatusService = new PaymentStatusService();
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

  async createPayment(paymentData: Omit<IPayment, "_id">): Promise<IPayment> {
    try {
      const cashRegisterId = await this.validationService.validatePayment(paymentData as CreatePaymentDTO);
      const normalizedMethod = this.validationService.normalizePaymentMethod(paymentData.paymentMethod);

      const paymentStatus = this.resolveInitialPaymentStatus(paymentData);

      const normalizedData = {
        ...paymentData,
        paymentMethod: normalizedMethod as IPayment["paymentMethod"],
        cashRegisterId,
        date: paymentData.date || new Date(),
        status: paymentStatus,
      };

      // Executa criação do pagamento + atualização do pedido atomicamente
      const payment = await withTransaction(async (session) => {
        const created = await this.paymentRepository.createInSession(normalizedData, session);

        if (created.orderId && created._id) {
          await this.paymentStatusService.updateOrderPaymentStatusInSession(
            created.orderId.toString(),
            created._id.toString(),
            created.amount,
            created.paymentMethod,
            session,
            created.status
          );
        }

        return created;
      });

      // Se há um pedido associado, atualizar o status de pagamento do pedido
      if (payment.orderId && payment._id) {
        try {
          const { PaymentStatusService } = await import('./PaymentStatusService');
          const paymentStatusService = new PaymentStatusService();

          await paymentStatusService.updateOrderPaymentStatus(
            payment.orderId.toString(),
            payment._id.toString(),
            payment.amount,
            payment.paymentMethod,
            'add'
          );

          logger.info(`Status do pedido ${payment.orderId} atualizado com pagamento ${payment._id}`);
        } catch (error) {
          logger.error('Erro ao atualizar status do pedido após pagamento', { error });
        }
      }

      this.cache.flushAll();

      return payment;
    } catch (error) {
      if (error instanceof PaymentValidationError) {
        throw new PaymentError(error.message);
      }
      throw error;
    }
  }

  private resolveInitialPaymentStatus(paymentData: Omit<IPayment, "_id">): IPayment["status"] {
    const instantMethods: IPayment["paymentMethod"][] = ["cash", "pix", "debit", "credit", "mercado_pago"];
    if (paymentData.type === "sale" && instantMethods.includes(paymentData.paymentMethod)) {
      return "completed";
    }
    return paymentData.status || "pending";
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

  // ==================== MÉTODOS SICREDI ====================

  /**
   * Gera boleto via SICREDI
   * @param paymentId ID do pagamento
   * @param customerData Dados do cliente
   * @returns Dados do boleto gerado
   */
  async generateSicrediBoleto(
    paymentId: string,
    customerData: {
      cpfCnpj: string;
      nome: string;
      endereco: {
        logradouro: string;
        numero: string;
        complemento?: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
      };
    }
  ): Promise<{
    success: boolean;
    data?: {
      nossoNumero: string;
      codigoBarras: string;
      linhaDigitavel: string;
      qrCode?: string;
    };
    error?: string;
  }> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentError("Pagamento não encontrado");
      }

      if (payment.paymentMethod !== "sicredi_boleto" && payment.paymentMethod !== "bank_slip") {
        throw new PaymentError("Método de pagamento não é boleto");
      }

      const { getSicrediConfig } = await import('../config/sicredi');
      const sicrediConfig = getSicrediConfig();

      const dueDate =
        payment.bank_slip?.sicredi?.dataVencimento?.toISOString().split('T')[0] ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Truncate address to 40 chars as required by Sicredi
      const enderecoStr = `${customerData.endereco.logradouro}, ${customerData.endereco.numero}`.substring(0, 40);
      const cepStr = customerData.endereco.cep.replace(/\D/g, '').substring(0, 8);
      const docStr = customerData.cpfCnpj.replace(/\D/g, '');
      const tipoPessoa: 'PESSOA_FISICA' | 'PESSOA_JURIDICA' = docStr.length <= 11 ? 'PESSOA_FISICA' : 'PESSOA_JURIDICA';

      // seuNumero: max 10 chars
      const seuNumero = paymentId.substring(paymentId.length - 10);

      const boletoRequest = {
        tipoCobranca: 'NORMAL' as const,
        codigoBeneficiario: sicrediConfig.beneficiaryCode,
        especieDocumento: 'RECIBO' as const,
        seuNumero,
        dataVencimento: dueDate,
        valor: payment.amount,
        pagador: {
          tipoPessoa,
          documento: docStr,
          nome: customerData.nome.substring(0, 200),
          endereco: enderecoStr,
          cidade: customerData.endereco.cidade.substring(0, 40),
          uf: customerData.endereco.uf.toUpperCase().substring(0, 2),
          cep: cepStr || undefined,
          email: undefined,
        },
        mensagem: payment.description
          ? [payment.description.substring(0, 80)]
          : ['Pagamento - Oticas Queiroz'],
      };

      const sicrediResponse = await this.sicrediService.generateBoleto(boletoRequest);

      if (sicrediResponse.status === 'error') {
        throw new PaymentError(sicrediResponse.error?.message || "Erro ao gerar boleto");
      }

      const updateData: Partial<IPayment> = {
        bank_slip: {
          ...payment.bank_slip,
          sicredi: {
            nossoNumero: sicrediResponse.data!.nossoNumero,
            codigoBarras: sicrediResponse.data!.codigoBarras,
            linhaDigitavel: sicrediResponse.data!.linhaDigitavel,
            qrCode: sicrediResponse.data!.qrCode,
            status: "REGISTRADO" as const,
            dataVencimento: new Date(dueDate),
          },
        },
      };

      await this.paymentRepository.update(paymentId, updateData);

      return { success: true, data: sicrediResponse.data };
    } catch (error) {
      logger.error("Erro ao gerar boleto SICREDI", { paymentId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Consulta status de boleto SICREDI
   * @param paymentId ID do pagamento
   * @returns Status atualizado do boleto
   */
  async checkSicrediBoletoStatus(paymentId: string): Promise<{
    success: boolean;
    data?: {
      status: string;
      valorPago?: number;
      dataPagamento?: Date;
    };
    error?: string;
  }> {
    try {
      // Buscar o pagamento
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentError("Pagamento não encontrado");
      }

      if (!payment.bank_slip?.sicredi?.nossoNumero) {
        throw new PaymentError("Boleto não foi gerado via SICREDI");
      }

      const statusResponse = await this.sicrediService.getBoleto(
        payment.bank_slip.sicredi.nossoNumero
      );

      if (statusResponse.status === 'error') {
        throw new PaymentError(statusResponse.error?.message || "Erro ao consultar status");
      }

      const boletoData = statusResponse.data!;
      // Sicredi returns situacao (e.g. "A VENCER", "PAGO", "BAIXADO")
      // Map to our internal status values
      const rawStatus = boletoData.situacao?.toUpperCase() || '';
      const mappedStatus = rawStatus.includes('PAGO') ? 'PAGO'
        : rawStatus.includes('BAIXADO') ? 'BAIXADO'
        : rawStatus.includes('PROTESTADO') ? 'PROTESTADO'
        : rawStatus.includes('VENCIDO') || rawStatus.includes('VENCER') && new Date(boletoData.dataVencimento || '') < new Date()
          ? 'VENCIDO'
        : 'REGISTRADO';

      const updateData: Partial<IPayment> = {
        bank_slip: {
          ...payment.bank_slip,
          sicredi: {
            ...payment.bank_slip.sicredi,
            status: mappedStatus as "REGISTRADO" | "BAIXADO" | "PAGO" | "VENCIDO" | "PROTESTADO" | "CANCELADO",
            valorPago: boletoData.valorPago,
            dataPagamento: boletoData.dataPagamento ? new Date(boletoData.dataPagamento) : undefined,
            dataBaixa: boletoData.dataBaixa ? new Date(boletoData.dataBaixa) : undefined,
          },
        },
        ...(mappedStatus === "PAGO" && { status: "completed" as const }),
      };

      await this.paymentRepository.update(paymentId, updateData);

      return {
        success: true,
        data: {
          status: mappedStatus,
          valorPago: boletoData.valorPago,
          dataPagamento: boletoData.dataPagamento ? new Date(boletoData.dataPagamento) : undefined,
        },
      };

    } catch (error) {
      logger.error("Erro ao consultar status do boleto SICREDI", { paymentId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }

  /**
   * Cancela boleto SICREDI
   * @param paymentId ID do pagamento
   * @param motivo Motivo do cancelamento
   * @returns Resultado do cancelamento
   */
  async cancelSicrediBoleto(
    paymentId: string,
    motivo: "ACERTOS" | "APEDIDODOCLIENTE" | "PAGODIRETOAOCLIENTE" | "SUBSTITUICAO" | "FALTADESOLUCAO" | "APEDIDODOBENEFICIARIO"
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Buscar o pagamento
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentError("Pagamento não encontrado");
      }

      if (!payment.bank_slip?.sicredi?.nossoNumero) {
        throw new PaymentError("Boleto não foi gerado via SICREDI");
      }

      const cancelResponse = await this.sicrediService.cancelBoleto(
        payment.bank_slip.sicredi.nossoNumero
      );

      if (cancelResponse.status === 'error') {
        throw new PaymentError(cancelResponse.error?.message || "Erro ao cancelar boleto");
      }

      // Atualizar pagamento
      const updateData: Partial<IPayment> = {
        bank_slip: {
          ...payment.bank_slip,
          sicredi: {
            ...payment.bank_slip.sicredi,
            status: "CANCELADO" as const,
            motivoCancelamento: motivo,
          }
        },
        status: "cancelled" as const
      };

      await this.paymentRepository.update(paymentId, updateData);

      return { success: true };

    } catch (error) {
      logger.error("Erro ao cancelar boleto SICREDI", { paymentId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }

  /**
   * Testa conexão com SICREDI
   * @returns Resultado do teste
   */
  async testSicrediConnection(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const isConnected = await this.sicrediService.testConnection();
      return {
        success: isConnected
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }
} 