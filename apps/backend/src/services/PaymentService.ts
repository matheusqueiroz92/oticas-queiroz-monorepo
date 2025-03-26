import { PaymentModel } from "../models/PaymentModel";
import { CashRegisterModel } from "../models/CashRegisterModel";
import { OrderModel } from "../models/OrderModel";
import { UserModel } from "../models/UserModel";
import { LegacyClientModel } from "../models/LegacyClientModel";
import type { IPayment, CreatePaymentDTO } from "../interfaces/IPayment";
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
  private paymentModel: PaymentModel;
  private cashRegisterModel: CashRegisterModel;
  private orderModel: OrderModel;
  private userModel: UserModel;
  private legacyClientModel: LegacyClientModel;
  private exportUtils: ExportUtils;
  private cache: NodeCache;

  constructor() {
    this.paymentModel = new PaymentModel();
    this.cashRegisterModel = new CashRegisterModel();
    this.orderModel = new OrderModel();
    this.userModel = new UserModel();
    this.legacyClientModel = new LegacyClientModel();
    this.exportUtils = new ExportUtils();
    this.cache = new NodeCache({ stdTTL: 300 }); // Cache com expiração de 5 minutos
  }

  /**
   * Invalida cache quando houver alterações
   * @param keys
   */
  private invalidateCache(keys: string | string[]): void {
    if (Array.isArray(keys)) {
      // Substituindo forEach por for...of para evitar o erro do linter
      for (const key of keys) {
        this.cache.del(key);
      }
    } else {
      this.cache.del(keys);
    }
  }

  /**
   * Valida dados de débito ao cliente
   * @param clientDebt Dados de débito
   */
  private validateClientDebtData(clientDebt: {
    generateDebt: boolean;
    installments?: { total: number; value: number };
    dueDates?: Date[];
  }): void {
    if (
      !clientDebt.installments ||
      !clientDebt.installments.total ||
      !clientDebt.installments.value
    ) {
      throw new PaymentError(
        "Dados de parcelamento são obrigatórios para débito ao cliente"
      );
    }

    if (!clientDebt.dueDates || clientDebt.dueDates.length === 0) {
      throw new PaymentError(
        "Datas de vencimento são obrigatórias para débito ao cliente"
      );
    }

    if (clientDebt.installments.total !== clientDebt.dueDates.length) {
      throw new PaymentError(
        "O número de datas de vencimento deve ser igual ao número de parcelas"
      );
    }
  }

  /**
   * Valida o valor do pagamento
   * @param amount Valor do pagamento
   * @throws PaymentError se o valor for inválido
   */
  private validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new PaymentError("Valor do pagamento deve ser maior que zero");
    }
  }

  /**
   * Verifica e retorna o caixa aberto
   * @returns ID do caixa aberto
   * @throws PaymentError se não houver caixa aberto
   */
  private async validateAndGetOpenRegister(): Promise<string> {
    const openRegister = await this.cashRegisterModel.findOpenRegister();
    if (!openRegister || !openRegister._id) {
      throw new PaymentError("Não há caixa aberto no momento");
    }
    return openRegister._id;
  }

  /**
   * Valida um pedido
   * @param orderId ID do pedido
   * @throws PaymentError se o pedido não existir ou estiver cancelado
   */
  private async validateOrder(orderId?: string): Promise<void> {
    if (!orderId) return;

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new PaymentError("Pedido não encontrado");
    }
    if (order.status === "cancelled") {
      throw new PaymentError(
        "Não é possível registrar pagamento de pedido cancelado"
      );
    }
  }

  /**
   * Valida um cliente
   * @param customerId ID do cliente
   * @throws PaymentError se o cliente não existir
   */
  private async validateCustomer(customerId?: string): Promise<void> {
    if (!customerId) return;

    const user = await this.userModel.findById(customerId);
    if (!user) {
      throw new PaymentError("Cliente não encontrado");
    }
  }

  /**
   * Valida um cliente legado
   * @param legacyClientId ID do cliente legado
   * @throws PaymentError se o cliente legado não existir
   */
  private async validateLegacyClient(legacyClientId?: string): Promise<void> {
    if (!legacyClientId) return;

    const legacyClient = await this.legacyClientModel.findById(legacyClientId);
    if (!legacyClient) {
      throw new PaymentError("Cliente legado não encontrado");
    }
  }

  /**
   * Valida dados de parcelamento
   * @param paymentMethod Método de pagamento
   * @param installments Dados de parcelamento
   * @throws PaymentError se os dados de parcelamento forem inválidos
   */
  private validateInstallments(
    paymentMethod: string,
    installments?: { current: number; total: number; value: number }
  ): void {
    if (paymentMethod === "installment") {
      if (!installments) {
        throw new PaymentError(
          "Dados de parcelamento são obrigatórios para pagamento parcelado"
        );
      }
      if (installments.total < 2) {
        throw new PaymentError("Número de parcelas deve ser maior que 1");
      }
      if (installments.value <= 0) {
        throw new PaymentError("Valor da parcela deve ser maior que zero");
      }
    }
  }

  /**
   * Valida todos os dados de pagamento
   * @param paymentData Dados do pagamento
   * @returns ID do caixa aberto
   * @throws PaymentError se houver validação que falhe
   */
  private async validatePayment(
    paymentData: CreatePaymentDTO
  ): Promise<string> {
    this.validateAmount(paymentData.amount);

    const cashRegisterId = await this.validateAndGetOpenRegister();

    // Validações específicas por tipo de pagamento
    if (paymentData.type === "sale") {
      await this.validateOrder(paymentData.orderId);
    }

    await this.validateCustomer(paymentData.customerId);
    await this.validateLegacyClient(paymentData.legacyClientId);

    // Validações específicas por método de pagamento
    switch (paymentData.paymentMethod) {
      case "credit":
        // Validar dados de parcelamento de cartão
        if (
          paymentData.creditCardInstallments?.total &&
          paymentData.creditCardInstallments.total > 1
        ) {
          if (!paymentData.creditCardInstallments.value) {
            throw new PaymentError(
              "Valor das parcelas é obrigatório para parcelamento no cartão"
            );
          }
        }
        break;

      case "bank_slip":
        // Validar dados de boleto
        if (!paymentData.bank_slip || !paymentData.bank_slip.code) {
          throw new PaymentError("Código do boleto é obrigatório");
        }

        // Se gerar débito, validar parcelamento
        if (paymentData.clientDebt?.generateDebt) {
          this.validateClientDebtData(paymentData.clientDebt);
        }
        break;

      case "promissory_note":
        // Validar dados de promissória
        if (!paymentData.promissoryNote || !paymentData.promissoryNote.number) {
          throw new PaymentError("Número da promissória é obrigatório");
        }

        // Se gerar débito, validar parcelamento
        if (paymentData.clientDebt?.generateDebt) {
          this.validateClientDebtData(paymentData.clientDebt);
        }
        break;
    }

    return cashRegisterId;
  }

    /**
   * Normaliza o método de pagamento para compatibilidade com o frontend
   * @param paymentMethod Método de pagamento do backend
   * @returns Método de pagamento normalizado
   */
  private normalizePaymentMethod(paymentMethod: string): string {
    // Mapear os métodos de pagamento do backend para os do frontend
    switch (paymentMethod) {
      case "bank_slip":
      case "promissory_note":
        return "installment"; // No frontend, boleto e promissória são mapeados como "installment"
      default:
        return paymentMethod; // Outros métodos mantêm o mesmo nome
    }
  }

  /**
   * Atualiza a dívida de um cliente após um pagamento
   * @param customerId ID do cliente
   * @param legacyClientId ID do cliente legado
   * @param debtAmount Valor da dívida (negativo para redução da dívida)
   * @param paymentId ID do pagamento (opcional, para cliente legado)
   */
  private async updateClientDebt(
    customerId?: string,
    legacyClientId?: string,
    debtAmount?: number,
    paymentId?: string
  ): Promise<void> {
    if (!debtAmount) return;

    if (customerId) {
      const user = await this.userModel.findById(customerId);
      if (user) {
        const currentDebt = user.debts || 0;
        await this.userModel.update(customerId, {
          debts: currentDebt + debtAmount,
        });
      }
    } else if (legacyClientId) {
      await this.legacyClientModel.updateDebt(
        legacyClientId,
        debtAmount,
        paymentId
      );
    }
  }

  /**
   * Atualiza o caixa com base no tipo e método de pagamento
   */
  private async updateCashRegister(
    cashRegisterId: string,
    payment: IPayment
  ): Promise<void> {
    // Mapear os novos métodos de pagamento para os tipos aceitos pelo caixa
    let registerMethod: "credit" | "debit" | "cash" | "pix";

    switch (payment.paymentMethod) {
      case "credit":
        registerMethod = "credit";
        break;
      case "debit":
        registerMethod = "debit";
        break;
      case "cash":
        registerMethod = "cash";
        break;
      case "pix":
        registerMethod = "pix";
        break;
      case "bank_slip":
      case "promissory_note":
        // Para boleto e promissória, registramos como "cash" no caixa
        // Ou escolha outro tipo que faça mais sentido para o negócio
        registerMethod = "cash";
        break;
    }

    // Atualizar valores do caixa
    await this.cashRegisterModel.updateSalesAndPayments(
      cashRegisterId,
      payment.type,
      payment.amount,
      registerMethod
    );
  }

  /**
   * Cria um novo pagamento
   * @param paymentData Dados do pagamento
   * @returns Pagamento criado
   */
  async createPayment(paymentData: CreatePaymentDTO): Promise<IPayment> {
    // Validar os dados do pagamento e obter o ID do caixa
    const cashRegisterId = await this.validatePayment(paymentData);

    // Mapeamento para o método de caixa
    let registerMethod: "credit" | "debit" | "cash" | "pix";

    switch (paymentData.paymentMethod) {
      case "credit":
        registerMethod = "credit";
        break;
      case "debit":
        registerMethod = "debit";
        break;
      case "cash":
        registerMethod = "cash";
        break;
      case "pix":
        registerMethod = "pix";
        break;
      case "bank_slip":
      case "promissory_note":
        // Para boleto e promissória, registramos como "cash" no caixa
        registerMethod = "cash";
        break;
    }

    const payment = await this.paymentModel.create({
      ...paymentData,
      cashRegisterId: cashRegisterId,
      status: "completed",
    });

    // Usar a função auxiliar
    await this.updateCashRegister(cashRegisterId, payment);

    // Atualizar o caixa
    await this.cashRegisterModel.updateSalesAndPayments(
      cashRegisterId,
      payment.type,
      payment.amount,
      registerMethod
    );

    // Se for pagamento de dívida, atualizar a dívida do cliente
    if (payment.type === "debt_payment") {
      const debtAmount = -payment.amount;
      await this.updateClientDebt(
        payment.customerId,
        payment.legacyClientId,
        debtAmount,
        payment._id
      );
    }

    // Se for boleto ou promissória com geração de débito, atualizar débito do cliente
    if (
      (payment.paymentMethod === "bank_slip" ||
        payment.paymentMethod === "promissory_note") &&
      payment.clientDebt?.generateDebt
    ) {
      // Calcular o valor total do débito (total do parcelamento)
      const totalDebt =
        payment.clientDebt.installments?.total &&
        payment.clientDebt.installments.value
          ? payment.clientDebt.installments.total *
            payment.clientDebt.installments.value
          : payment.amount;

      await this.updateClientDebt(
        payment.customerId,
        payment.legacyClientId,
        totalDebt,
        payment._id
      );
    }

    // Invalidar cache
    const date = new Date(payment.date);
    const dateString = date.toISOString().split("T")[0];
    this.invalidateCache([
      `daily_payments_${dateString}_all`,
      `daily_payments_${dateString}_${payment.type}`,
    ]);

    return payment;
  }

  /**
   * Obtém um pagamento pelo ID
   * @param id ID do pagamento
   * @returns Pagamento encontrado
   * @throws PaymentError se o pagamento não for encontrado
   */
  async getPaymentById(id: string): Promise<IPayment> {
    const cacheKey = `payment_${id}`;

    // Verificar cache
    const cachedPayment = this.cache.get<IPayment>(cacheKey);
    if (cachedPayment) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedPayment;
    }

    const payment = await this.paymentModel.findById(id, true);
    if (!payment) {
      throw new PaymentError("Pagamento não encontrado");
    }

    // Armazenar em cache
    this.cache.set(cacheKey, payment);

    return payment;
  }

    /**
   * Obtém todos os pagamentos com filtros e paginação
   * @param page Número da página
   * @param limit Limite de itens por página
   * @param filters Filtros a serem aplicados
   * @returns Pagamentos e total
   */
  async getAllPayments(
    page?: number,
    limit?: number,
    filters: Partial<IPayment> = {}
  ): Promise<{ payments: IPayment[]; total: number }> {
    try {
      const result = await this.paymentModel.findAll(page, limit, filters, true);
      
      // Normalizar os métodos de pagamento para compatibilidade com o frontend
      const normalizedPayments = result.payments.map(payment => ({
        ...payment,
        paymentMethod: this.normalizePaymentMethod(payment.paymentMethod) as any
      }));
      
      return {
        payments: normalizedPayments || [],
        total: result.total || 0,
      };
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      return { payments: [], total: 0 };
    }
  }

  /**
   * Obtém pagamentos de um dia específico
   * @param date Data para consulta
   * @param type Tipo de pagamento (opcional)
   * @returns Lista de pagamentos
   */
  async getDailyPayments(
    date: Date,
    type?: IPayment["type"]
  ): Promise<IPayment[]> {
    const dateString = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    const cacheKey = `daily_payments_${dateString}_${type || "all"}`;

    // Verificar cache
    const cachedResult = this.cache.get<IPayment[]>(cacheKey);
    if (cachedResult) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedResult;
    }

    // Buscar do banco se não estiver em cache
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dateFilter: DateRangeQuery = {
      $gte: startOfDay,
      $lte: endOfDay,
    };

    const filters: Partial<IPayment> = {
      date: dateFilter as unknown as Date,
    };

    if (type) {
      filters.type = type;
    }

    const result = await this.paymentModel.findAll(1, 1000, filters);

    // Armazenar em cache
    this.cache.set(cacheKey, result.payments);

    return result.payments;
  }

  /**
   * Cancela um pagamento
   * @param id ID do pagamento
   * @param userId ID do usuário que está cancelando
   * @returns Pagamento cancelado
   * @throws PaymentError se o cancelamento falhar
   */
  async cancelPayment(id: string, userId: string): Promise<IPayment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) {
      throw new PaymentError("Pagamento não encontrado");
    }

    if (payment.status === "cancelled") {
      throw new PaymentError("Pagamento já está cancelado");
    }

    const register = await this.cashRegisterModel.findById(
      payment.cashRegisterId
    );
    if (!register) {
      throw new PaymentError("Caixa não encontrado");
    }

    if (register.status === "closed") {
      throw new PaymentError(
        "Não é possível cancelar pagamento de um caixa fechado"
      );
    }

    // Atualizar caixa usando a função auxiliar (com valor negativo para cancelamento)
    await this.updateCashRegister(payment.cashRegisterId, {
      ...payment,
      amount: -payment.amount,
    });

    // Atualizar dívida se necessário
    if (payment.type === "debt_payment") {
      const debtAmount = payment.amount;
      await this.updateClientDebt(
        payment.customerId,
        payment.legacyClientId,
        debtAmount
      );
    }

    // Se for boleto ou promissória com geração de débito, reverter débito do cliente
    if (
      (payment.paymentMethod === "bank_slip" ||
        payment.paymentMethod === "promissory_note") &&
      payment.clientDebt?.generateDebt
    ) {
      // Calcular o valor total do débito (total do parcelamento)
      const totalDebt =
        payment.clientDebt.installments?.total &&
        payment.clientDebt.installments.value
          ? -(
              payment.clientDebt.installments.total *
              payment.clientDebt.installments.value
            )
          : -payment.amount;

      await this.updateClientDebt(
        payment.customerId,
        payment.legacyClientId,
        totalDebt
      );
    }

    // Atualizar status do pagamento
    const updatedPayment = await this.paymentModel.updateStatus(
      id,
      "cancelled"
    );

    if (!updatedPayment) {
      throw new PaymentError("Erro ao cancelar pagamento");
    }

    // Invalidar cache
    this.invalidateCache(`payment_${id}`);
    const date = new Date(payment.date);
    const dateString = date.toISOString().split("T")[0];
    this.invalidateCache([
      `daily_payments_${dateString}_all`,
      `daily_payments_${dateString}_${payment.type}`,
    ]);

    return updatedPayment;
  }

  /**
   * Realiza exclusão lógica (soft delete) de um pagamento
   * @param id ID do pagamento
   * @param userId ID do usuário que está excluindo
   * @returns Pagamento marcado como excluído ou null se não encontrado
   * @throws PaymentError se não for possível excluir o pagamento
   */
  async softDeletePayment(id: string, userId: string): Promise<IPayment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) {
      throw new PaymentError("Pagamento não encontrado");
    }

    if (payment.isDeleted) {
      throw new PaymentError("Pagamento já está excluído");
    }

    // Verificar se o pagamento já foi cancelado
    if (payment.status !== "cancelled") {
      throw new PaymentError(
        "Pagamento deve ser cancelado antes de ser excluído"
      );
    }

    // Verificar se o caixa está aberto
    const register = await this.cashRegisterModel.findById(
      payment.cashRegisterId
    );
    if (!register) {
      throw new PaymentError("Caixa não encontrado");
    }

    if (register.status === "closed") {
      throw new PaymentError(
        "Não é possível excluir pagamento de um caixa fechado"
      );
    }

    const deletedPayment = await this.paymentModel.softDelete(id, userId);
    if (!deletedPayment) {
      throw new PaymentError("Erro ao excluir pagamento");
    }

    // Invalidar cache
    this.invalidateCache(`payment_${id}`);
    const date = new Date(payment.date);
    const dateString = date.toISOString().split("T")[0];
    this.invalidateCache([
      `daily_payments_${dateString}_all`,
      `daily_payments_${dateString}_${payment.type}`,
    ]);

    return deletedPayment;
  }

  /**
   * Recupera pagamentos excluídos que se encaixam nos filtros informados
   * @param page Número da página
   * @param limit Limite de itens por página
   * @param filters Filtros a serem aplicados
   * @returns Pagamentos excluídos e total
   */
  async getDeletedPayments(
    page?: number,
    limit?: number,
    filters: Partial<IPayment> = {}
  ): Promise<{ payments: IPayment[]; total: number }> {
    // Combinar os filtros fornecidos com a condição isDeleted = true
    const deletedFilters = {
      ...filters,
      isDeleted: true,
    };

    const result = await this.paymentModel.findAll(
      page,
      limit,
      deletedFilters,
      true,
      true // incluir documentos excluídos
    );

    return {
      payments: result.payments || [],
      total: result.total || 0,
    };
  }

  /**
   * Exporta pagamentos filtrados
   * @param filters Filtros para selecionar pagamentos
   * @param options Opções de exportação (formato, título, etc)
   * @returns Buffer com dados exportados e metadados
   */
  async exportPayments(
    options: ExportOptions,
    filters: Partial<IPayment> = {}
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Buscar todos os pagamentos que correspondem aos filtros (sem paginação)
    const result = await this.paymentModel.findAll(1, 1000, filters, true);

    // Exportar os pagamentos para o formato solicitado
    return this.exportUtils.exportPayments(result.payments, options);
  }

  /**
   * Exporta relatório financeiro
   * @param reportData Dados do relatório
   * @param options Opções de exportação
   * @returns Buffer com dados exportados e metadados
   */
  async exportFinancialReport(
    reportData: FinancialReportData,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    // Utilizamos o ExportUtils para exportar o relatório financeiro
    return this.exportUtils.exportFinancialReport(reportData, options);
  }
}
