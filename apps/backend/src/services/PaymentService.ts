import { PaymentModel } from "../models/PaymentModel";
import { CashRegisterModel } from "../models/CashRegisterModel";
import { OrderModel } from "../models/OrderModel";
import { UserModel } from "../models/UserModel";
import { LegacyClientModel } from "../models/LegacyClientModel";
import type { IPayment, CreatePaymentDTO } from "../interfaces/IPayment";
import NodeCache from "node-cache";
import { ExportUtils, type ExportOptions } from "../utils/exportUtils";
import mongoose from "mongoose";

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
    this.cache = new NodeCache({ stdTTL: 300 });
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
   * Verifica o método de pagamento parcelado
   * @param paymentMethod Método de pagamento
   */
  private isInstallmentPaymentMethod(paymentMethod: string): boolean {
    return paymentMethod === "bank_slip" || paymentMethod === "promissory_note";
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
      
      // Se for venda e método for parcelado, verificar se é necessário registrar débito
      if (paymentData.orderId && (
          paymentData.paymentMethod === "bank_slip" || 
          paymentData.paymentMethod === "promissory_note" ||
          paymentData.paymentMethod === "check"
        )) {
      }
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
        
        case "check":
          // Validar dados do cheque
          if (!paymentData.check || 
              !paymentData.check.bank || 
              !paymentData.check.checkNumber ||
              !paymentData.check.checkDate ||
              !paymentData.check.accountHolder ||
              !paymentData.check.branch ||
              !paymentData.check.accountNumber) {
            throw new PaymentError("Dados completos do cheque são obrigatórios");
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
      case "check":
        return "check"; 
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
   * @param institutionId ID da instituição
   */
  private async updateClientDebt(
    customerId?: string,
    legacyClientId?: string,
    debtAmount?: number,
    paymentId?: string,
    institutionId?: string
  ): Promise<void> {
    if (!debtAmount) {
      return;
    }
  
    const operation = debtAmount > 0 ? "adicionada" : "reduzida";
    const absAmount = Math.abs(debtAmount);
  
    // Tratamento para instituições
    if (institutionId) {
      try {
        const institution = await this.userModel.findById(institutionId);
        if (!institution) {
          console.error(`Instituição ${institutionId} não encontrada ao atualizar dívida`);
          return;
        }
        
        const currentDebt = institution.debts || 0;
        const newDebt = Math.max(0, currentDebt + debtAmount); // Evita dívidas negativas
        
        await this.userModel.update(institutionId, {
          debts: newDebt,
        });
        return;
      } catch (error) {
        console.error(`Erro ao atualizar dívida da instituição ${institutionId}:`, error);
        return;
      }
    }
  
    // Tratamento para clientes normais
    if (customerId) {
      try {
        const user = await this.userModel.findById(customerId);
        if (!user) {
          console.error(`Cliente ${customerId} não encontrado ao atualizar dívida`);
          return;
        }
        
        const currentDebt = user.debts || 0;
        const newDebt = Math.max(0, currentDebt + debtAmount); // Evita dívidas negativas
        
        // MODIFICAÇÃO IMPORTANTE: Agora atualizamos diretamente o campo debts
        await this.userModel.update(customerId, {
          debts: newDebt,
        });
      } catch (error) {
        console.error(`Erro ao atualizar dívida do cliente ${customerId}:`, error);
      }
    } 
    // Tratamento para clientes legados
    else if (legacyClientId) {
      try {
        await this.legacyClientModel.updateDebt(
          legacyClientId,
          debtAmount,
          paymentId
        );
      } catch (error) {
        console.error(`Erro ao atualizar dívida do cliente legado ${legacyClientId}:`, error);
      }
    } else {
      console.warn("Tentativa de atualizar dívida sem ID de cliente ou cliente legado");
    }
  }
  
  /**
   * Atualiza o caixa com base no tipo e método de pagamento
   * @param cashRegisterId ID do registro de caixa
   * @param payment pagamento a ser registrado
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
      case "check":
      case "mercado_pago":
        // Para boleto e promissória ou cheque, registramos como "cash" no caixa
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
  async createPayment(paymentData: Omit<IPayment, "_id">): Promise<IPayment> {
    const session = await mongoose.connection.startSession();
    session.startTransaction();
    
    try {
      // Validar os dados do pagamento e obter o ID do caixa
      const cashRegisterId = await this.validatePayment(paymentData);
    
      // Verificar se já existe um pagamento com os mesmos detalhes para evitar duplicação
      if (paymentData.orderId) {
        const existingPayments = await this.paymentModel.findAll(1, 100, {
          orderId: paymentData.orderId,
          amount: paymentData.amount,
          type: paymentData.type,
          paymentMethod: paymentData.paymentMethod,
          status: "completed"
        });
        
        if (existingPayments.payments.length > 0) {
          return existingPayments.payments[0];
        }
      }
    
      // Criar o pagamento
      let payment: IPayment | null = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!payment && retryCount < maxRetries) {
        try {
          payment = await this.paymentModel.create({
            ...paymentData,
            cashRegisterId: cashRegisterId,
            status: "completed", // Marcar como concluído imediatamente
          });
        } catch (error) {
          retryCount++;
          console.error(`Erro ao criar pagamento (tentativa ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount >= maxRetries) {
            throw new PaymentError("Falha ao criar pagamento após múltiplas tentativas");
          }
          
          // Esperar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }
    
      if (!payment) {
        throw new PaymentError("Falha ao criar pagamento");
      }
    
      // Atualizar o caixa - com retry
      let cashUpdateSuccess = false;
      retryCount = 0;
      
      while (!cashUpdateSuccess && retryCount < maxRetries) {
        try {
          await this.updateCashRegister(cashRegisterId, payment);
          cashUpdateSuccess = true;
        } catch (error) {
          retryCount++;
          console.error(`Erro ao atualizar caixa (tentativa ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount >= maxRetries) {
            // Nota: o pagamento foi criado, mas o caixa não foi atualizado
            // Isso pode precisar de correção manual ou lógica adicional para lidar com isso
            console.error(`Falha ao atualizar caixa após múltiplas tentativas. Pagamento ID: ${payment._id}`);
            // Não lançamos erro aqui para não interromper o fluxo, mas registramos o problema
          }
          
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }
    
      // Se o pagamento está relacionado a um pedido, atualizar o status de pagamento
      if (payment.orderId) {
        try {
          // IMPORTANTE: Passamos 'add' como ação para garantir que o pagamento seja adicionado ao histórico
          await this.updateOrderPaymentStatus(
            payment.orderId.toString(),
            payment._id,
            payment.amount,
            payment.paymentMethod,
            'add'  // Adicionamos esta ação explicitamente
          );
        } catch (error) {
          console.error(`Erro ao atualizar status de pagamento do pedido ${payment.orderId}:`, error);
          // Continuamos o fluxo mesmo com erro na atualização do pedido
        }
      }
  
      // MODIFICAÇÃO CRÍTICA: Atualizar o débito do cliente independentemente do tipo de pagamento
      // Se o pagamento for de um pedido, reduzir o débito do cliente
      if (payment.customerId || payment.legacyClientId) {
        try {
          // Valor negativo para reduzir a dívida (é uma entrada de dinheiro, logo reduz o débito)
          const debtAmount = -payment.amount;
          
          // Atualizar o débito do cliente ou cliente legado
          await this.updateClientDebt(
            payment.customerId,
            payment.legacyClientId,
            debtAmount,
            payment._id
          );
        } catch (error) {
          console.error(`Erro ao atualizar débito do cliente:`, error);
        }
      }
      
      // Para pagamentos institucionais
      if (payment.isInstitutionalPayment && payment.institutionId) {
        try {
          const debtAmount = -payment.amount; // Valor negativo para reduzir a dívida
          await this.updateClientDebt(
            undefined, 
            undefined, 
            debtAmount, 
            payment._id, 
            payment.institutionId
          );
        } catch (error) {
          console.error(`Erro ao atualizar dívida da instituição:`, error);
        }
      }
    
      // Invalidar cache
      try {
        const date = new Date(payment.date);
        const dateString = date.toISOString().split("T")[0];
        this.invalidateCache([
          `payment_${payment._id}`,
          `daily_payments_${dateString}_all`,
          `daily_payments_${dateString}_${payment.type}`,
        ]);
      } catch (error) {
        console.error("Erro ao invalidar cache:", error);
      }
    
      await session.commitTransaction();
      return payment;
    } catch (error) {
      console.error("Erro fatal ao processar pagamento:", error);
      await session.abortTransaction();
      if (error instanceof PaymentError) {
        throw error;
      }
      throw new PaymentError(
        error instanceof Error ? error.message : "Erro desconhecido ao criar pagamento"
      );
    } finally {
      session.endSession();
    }
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
    const session = await mongoose.connection.startSession();
    session.startTransaction();
    
    try {
      // Verificar se o pagamento existe
      const payment = await this.paymentModel.findById(id);
      if (!payment) {
        throw new PaymentError("Pagamento não encontrado");
      }
  
      // Verificar se já está cancelado
      if (payment.status === "cancelled") {
        console.log(`Pagamento ${id} já está cancelado. Retornando pagamento existente.`);
        return payment;
      }
  
      // Verificar se o caixa existe e está aberto
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
  
      let updatedPayment: IPayment | null = null;
      
      try {
        // Se o pagamento está relacionado a um pedido, verificar se precisamos reverter débitos
        if (payment.orderId) {
          try {
            // Atualizar status de pagamento do pedido
            await this.updateOrderPaymentStatus(
              payment.orderId.toString(),
              payment._id,
              undefined,
              undefined,
              'remove'
            );
            
            // Se o método de pagamento for parcelado, reverter o débito do cliente
            if (this.isInstallmentPaymentMethod(payment.paymentMethod) && 
                payment.type !== "debt_payment") {
              const order = await this.orderModel.findById(payment.orderId);
              if (order && order.clientId) {
                const debtAmount = -(order.finalPrice - (order.paymentEntry || 0)); // Valor negativo para reverter
                if (debtAmount < 0) {
                  console.log(`Cancelando pagamento parcelado para o pedido ${order._id}. Removendo débito do cliente ${order.clientId}`);
                  await this.updateClientDebt(
                    order.clientId.toString(),
                    undefined,
                    debtAmount
                  );
                }
              }
            }
          } catch (error) {
            console.error(`Erro ao processar pedido relacionado ao cancelar pagamento ${id}:`, error);
            // Continuamos o processo mesmo com erro na atualização do pedido
          }
        }
  
        // Atualizar caixa (com retry se necessário)
        let cashUpdateSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!cashUpdateSuccess && retryCount < maxRetries) {
          try {
            await this.updateCashRegister(payment.cashRegisterId, {
              ...payment,
              amount: -payment.amount,
            });
            cashUpdateSuccess = true;
          } catch (error) {
            retryCount++;
            console.error(`Erro ao atualizar caixa no cancelamento (tentativa ${retryCount}/${maxRetries}):`, error);
            
            if (retryCount >= maxRetries) {
              console.error(`Falha ao atualizar caixa após múltiplas tentativas. Pagamento ID: ${id}`);
              // Continuamos o processo mesmo com erro na atualização do caixa
              break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
        }
  
        // Atualizar dívida se necessário
        if (payment.isInstitutionalPayment && payment.institutionId && payment.type === "debt_payment") {
          try {
            const debtAmount = payment.amount; // Valor positivo para reverter a redução da dívida
            await this.updateClientDebt(
              undefined,
              undefined,
              debtAmount,
              undefined,
              payment.institutionId
            );
            console.log(`Revertendo pagamento institucional. Adicionando ${debtAmount} à dívida da instituição ${payment.institutionId}`);
          } catch (error) {
            console.error(`Erro ao atualizar dívida da instituição no cancelamento do pagamento ${id}:`, error);
          }
        }
        // Tratar pagamentos de dívida de clientes normais (código existente)
        else if (payment.type === "debt_payment") {
          try {
            const debtAmount = payment.amount; // Valor positivo para reverter a redução da dívida
            console.log(`Revertendo pagamento de dívida. Adicionando ${debtAmount} à dívida do cliente.`);
            await this.updateClientDebt(
              payment.customerId,
              payment.legacyClientId,
              debtAmount
            );
          } catch (error) {
            console.error(`Erro ao atualizar dívida do cliente no cancelamento do pagamento ${id}:`, error);
          }
        }
  
        // Se for boleto ou promissória com geração de débito, reverter débito do cliente
        if (
          this.isInstallmentPaymentMethod(payment.paymentMethod) &&
          payment.clientDebt?.generateDebt
        ) {
          try {
            // Calcular o valor total do débito (total do parcelamento)
            const totalDebt =
              payment.clientDebt.installments?.total &&
              payment.clientDebt.installments.value
                ? -(
                    payment.clientDebt.installments.total *
                    payment.clientDebt.installments.value
                  )
                : -payment.amount;
  
            console.log(`Revertendo débito parcelado. Reduzindo ${Math.abs(totalDebt)} da dívida do cliente.`);
            await this.updateClientDebt(
              payment.customerId,
              payment.legacyClientId,
              totalDebt
            );
          } catch (error) {
            console.error(`Erro ao reverter débito parcelado do cliente no cancelamento do pagamento ${id}:`, error);
          }
        }
  
        // Atualizar status do pagamento (com retry)
        retryCount = 0;
        while (!updatedPayment && retryCount < maxRetries) {
          try {
            updatedPayment = await this.paymentModel.updateStatus(
              id,
              "cancelled"
            );
          } catch (error) {
            retryCount++;
            console.error(`Erro ao atualizar status do pagamento (tentativa ${retryCount}/${maxRetries}):`, error);
            
            if (retryCount >= maxRetries) {
              throw new PaymentError("Erro ao cancelar pagamento após múltiplas tentativas");
            }
            
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
        }
  
        if (!updatedPayment) {
          throw new PaymentError("Erro ao cancelar pagamento");
        }
  
        // Invalidar cache
        try {
          this.invalidateCache(`payment_${id}`);
          const date = new Date(payment.date);
          const dateString = date.toISOString().split("T")[0];
          this.invalidateCache([
            `daily_payments_${dateString}_all`,
            `daily_payments_${dateString}_${payment.type}`,
          ]);
        } catch (error) {
          console.error("Erro ao invalidar cache:", error);
        }
  
        return updatedPayment;
      } catch (error) {
        console.error("Erro fatal ao cancelar pagamento:", error);
        if (error instanceof PaymentError) {
          throw error;
        }
        throw new PaymentError(
          error instanceof Error ? error.message : "Erro desconhecido ao cancelar pagamento"
        );
      }
    } catch (error) {
      console.error("Erro fatal ao cancelar pagamento:", error);
      if (error instanceof PaymentError) {
        throw error;
      }
      throw new PaymentError(
        error instanceof Error ? error.message : "Erro desconhecido ao cancelar pagamento"
      );
    }
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

  /**
   * Atualiza o status de pagamento de um pedido com base no histórico de pagamentos
   * @param orderId ID do pedido
   * @param paymentId ID do pagamento (opcional, para adicionar ou remover)
   * @param amount Valor do pagamento (opcional, necessário apenas para adicionar)
   * @param method Método de pagamento (opcional, necessário apenas para adicionar)
   * @param action Ação a ser realizada: 'add' para adicionar, 'remove' para remover, 'recalculate' para apenas recalcular
   */
  private async updateOrderPaymentStatus(
    orderId: string,
    paymentId?: string,
    amount?: number,
    method?: string,
    action: 'add' | 'remove' | 'recalculate' = 'recalculate'
  ): Promise<void> {
    if (!orderId) {
      console.error("ID do pedido é obrigatório para atualizar status de pagamento");
      return;
    }

    try {
      // Buscar o pedido atual
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        console.error(`Pedido ${orderId} não encontrado ao atualizar status de pagamento`);
        return;
      }

      console.log(`Atualizando pagamento para o pedido ${orderId}`);
      console.log(`Valor do pedido: ${order.finalPrice}`);
      console.log(`Valor do pagamento recebido: ${amount}`);

      // Log do histórico atual para debug
      console.log("Histórico de pagamentos atual:", JSON.stringify(order.paymentHistory || []));

      // Inicializar histórico de pagamentos se não existir
      // Importante: Garantir que estamos trabalhando com um novo array
      let updatedHistory = order.paymentHistory ? 
        JSON.parse(JSON.stringify(order.paymentHistory)) : [];

      // Verificar a estrutura do array para debug    
      console.log("Array de histórico inicializado:", JSON.stringify(updatedHistory));

      // Ação: Adicionar um novo pagamento ao histórico
      if (action === 'add' && paymentId && amount !== undefined && method) {
        console.log(`Adicionando pagamento ${paymentId} ao histórico com valor ${amount}`);
        
        // Verificar se o pagamento já existe no histórico
        const existingIndex = updatedHistory.findIndex(
          (entry: { paymentId: { toString: () => string; }; }) => entry && entry.paymentId && 
                  entry.paymentId.toString() === paymentId.toString()
        );
        
        const newEntry = {
          paymentId: paymentId.toString(),
          amount: Number(amount),
          date: new Date(),
          method: method
        };

        // Se não existir, adicionar. Se existir, atualizar.
        if (existingIndex === -1) {
          updatedHistory.push(newEntry);
          console.log(`Pagamento ${paymentId} adicionado ao histórico do pedido ${orderId}`);
        } else {
          updatedHistory[existingIndex] = newEntry;
          console.log(`Pagamento ${paymentId} atualizado no histórico do pedido ${orderId}`);
        }

        // Log após a atualização para debug
        console.log("Histórico após adicionar pagamento:", JSON.stringify(updatedHistory));
      } 
      // Ação: Remover um pagamento do histórico
      else if (action === 'remove' && paymentId) {
        console.log(`Removendo pagamento ${paymentId} do histórico`);
        
        const initialLength = updatedHistory.length;
        updatedHistory = updatedHistory.filter(
          (entry: { paymentId: { toString: () => string; }; }) => entry && entry.paymentId && 
                  entry.paymentId.toString() !== paymentId.toString()
        );
        
        if (updatedHistory.length < initialLength) {
          console.log(`Pagamento ${paymentId} removido do histórico do pedido ${orderId}`);
        } else {
          console.log(`Pagamento ${paymentId} não encontrado no histórico do pedido ${orderId}`);
        }

        // Log após a remoção para debug
        console.log("Histórico após remover pagamento:", JSON.stringify(updatedHistory));
      }
      
      // Calcular o total pago somando todos os pagamentos
      const totalPaid = updatedHistory.reduce((sum: any, entry: { amount: any; }) => {
        // Garantir que estamos somando apenas valores numéricos válidos
        const amount = entry && typeof entry.amount === 'number' ? entry.amount : 0;
        return sum + amount;
      }, 0);
      
      // Determinar o novo status de pagamento com base no total pago
      let newPaymentStatus: "pending" | "partially_paid" | "paid" = "pending";
      
      // Regras para definir o status do pagamento
      if (totalPaid === 0) {
        newPaymentStatus = "pending";
      } 
      else if (totalPaid >= order.finalPrice) {
        newPaymentStatus = "paid";
      } 
      else if (totalPaid > 0) {
        newPaymentStatus = "partially_paid";
      }
      
      console.log(`Atualizando status do pedido ${orderId}:`);
      console.log(`- Valor final: ${order.finalPrice}`);
      console.log(`- Total pago: ${totalPaid}`);
      console.log(`- Valor restante: ${Math.max(0, order.finalPrice - totalPaid)}`);
      console.log(`- Novo status: ${newPaymentStatus}`);
      
      // Verificar se houve mudanças antes de atualizar
      const historyChanged = JSON.stringify(updatedHistory) !== 
                            JSON.stringify(order.paymentHistory || []);
      const statusChanged = newPaymentStatus !== order.paymentStatus;
      
      if (historyChanged || statusChanged) {
        // Salvar explicitamente o histórico e o status usando o método update do model
        const updateResult = await this.orderModel.update(orderId, {
          paymentStatus: newPaymentStatus,
          paymentHistory: updatedHistory
        });
        
        if (updateResult) {
          console.log(`Status de pagamento do pedido ${orderId} atualizado para ${newPaymentStatus}`);
          console.log(`Histórico de pagamentos atualizado:`, JSON.stringify(updatedHistory));
        } else {
          console.error(`Falha ao atualizar o pedido ${orderId}`);
        }
        
        // Atualizar o débito do cliente para refletir o pagamento
        try {
          const order = await this.orderModel.findById(orderId);
          if (order && order.clientId) {
            const clientId = typeof order.clientId === 'string' 
              ? order.clientId 
              : order.clientId.toString();
              
            const customer = await this.userModel.findById(clientId);
            if (customer) {
              // Calcular o valor restante após o pagamento
              const remainingDebt = Math.max(0, order.finalPrice - totalPaid);
              
              // Calcular o ajuste de débito necessário
              const originalDebt = order.finalPrice - (order.paymentEntry || 0);
              const adjustmentNeeded = remainingDebt - originalDebt;
              
              // Se houver ajuste, atualizar o débito do cliente
              if (adjustmentNeeded !== 0) {
                const currentDebt = customer.debts || 0;
                const newDebt = Math.max(0, currentDebt + adjustmentNeeded); // Evitar débito negativo
                
                await this.userModel.update(clientId, {
                  debts: newDebt
                });
                console.log(`Débito do cliente ${clientId} ajustado em ${adjustmentNeeded}. Novo valor: ${newDebt}`);
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao atualizar débito do cliente para o pedido ${orderId}:`, error);
        }
      } else {
        console.log(`Nenhuma alteração necessária no status de pagamento do pedido ${orderId}`);
      }
      
      return;
    } catch (error) {
      console.error(`Erro ao atualizar status de pagamento do pedido ${orderId}:`, error);
    }
  }

  /**
   * Atualiza o status de compensação de um cheque
   * @param id ID do pagamento
   * @param status Novo status de compensação
   * @param rejectionReason Motivo da rejeição (obrigatório se o status for "rejected")
   * @returns Pagamento atualizado
   */
  async updateCheckCompensationStatus(
    id: string,
    status: "pending" | "compensated" | "rejected",
    rejectionReason?: string
  ): Promise<IPayment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) {
      throw new PaymentError("Pagamento não encontrado");
    }
    
    if (payment.paymentMethod !== "check") {
      throw new PaymentError("Este pagamento não é um cheque");
    }
    
    // Verificar se o objeto check já existe no pagamento
    if (!payment.check) {
      throw new PaymentError("Dados do cheque não encontrados no pagamento");
    }
    
    // Atualizamos o campo check com os novos valores
    const updatedCheck = {
      ...payment.check,
      compensationStatus: status
    };
    
    if (status === "rejected" && rejectionReason) {
      updatedCheck.rejectionReason = rejectionReason;
    }
    
    // Usamos o novo método updateCheckStatus do PaymentModel
    const updatedPayment = await this.paymentModel.updateCheckStatus(
      id,
      { check: updatedCheck }
    );
    
    if (!updatedPayment) {
      throw new PaymentError("Erro ao atualizar status do cheque");
    }
    
    // Invalidar cache se necessário
    this.invalidateCache(`payment_${id}`);
    
    // Tratar caso de rejeição (reverter valores, notificar, etc.)
    if (status === "rejected") {
      // Se um cheque for rejeitado, podemos precisar reverter o pagamento
      console.log(`Cheque ${payment._id} rejeitado: ${rejectionReason}`);
      
      // Aqui poderíamos implementar lógica para:
      // 1. Reverter o pagamento no caixa (usando updateCashRegister com valor negativo)
      // 2. Atualizar dívidas do cliente se necessário
      // 3. Notificar usuários sobre a rejeição
      // 4. Registrar em um log de auditoria
      
      // Por simplicidade, não implementaremos toda essa lógica agora,
      // mas é importante considerar essas ações em um sistema de produção
    }
    
    return updatedPayment;
  }

  /**
   * Obtém uma lista de cheques filtrados por status de compensação
   * @param status Status de compensação dos cheques (pending, compensated, rejected)
   * @param startDate Data inicial para filtro (opcional)
   * @param endDate Data final para filtro (opcional)
   * @returns Lista de pagamentos com cheques que correspondem aos critérios
   */
  async getChecksByStatus(
    status: "pending" | "compensated" | "rejected",
    startDate?: Date,
    endDate?: Date
  ): Promise<IPayment[]> {
    // Utilizamos o método especializado findChecksByStatus do PaymentModel
    const checks = await this.paymentModel.findChecksByStatus(
      status,
      startDate,
      endDate
    );
    
    // Criamos uma chave de cache para armazenar os resultados
    const cacheKey = `checks_${status}_${startDate?.toISOString() || 'none'}_${endDate?.toISOString() || 'none'}`;
    
    // Armazenamos os resultados em cache para melhorar a performance em consultas repetidas
    this.cache.set(cacheKey, checks, 300); // Cache por 5 minutos (300 segundos)
    
    return checks;
  }

  /**
   * Recalcula o status de pagamento de um pedido com base nos pagamentos realizados
   * @param orderId ID do pedido
   * @param customerId ID opcional do cliente para atualizar seu débito total
  */
  private async recalculateOrderPaymentStatus(orderId: string, customerId?: string): Promise<void> {
  try {
    // Buscar o pedido
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      console.error(`Pedido ${orderId} não encontrado ao recalcular status de pagamento`);
      return;
    }
    
    // Calcular o total pago
    const totalPaid = order.paymentHistory 
      ? order.paymentHistory.reduce((sum, entry) => sum + entry.amount, 0) 
      : 0;
    
    // Calcular o valor restante
    const remainingDebt = order.finalPrice - totalPaid;
    
    let newPaymentStatus: "pending" | "partially_paid" | "paid" = "pending";
    
    if (totalPaid >= order.finalPrice) {
      newPaymentStatus = "paid";
    } else if (totalPaid > 0) {
      newPaymentStatus = "partially_paid";
    }
    
    // Atualizar o status de pagamento do pedido
    if (newPaymentStatus !== order.paymentStatus) {
      await this.orderModel.update(orderId, {
        paymentStatus: newPaymentStatus
      });
    }
    
    // Se o cliente foi informado, atualizar o débito total do cliente
    if (customerId && (order.paymentMethod === 'bank_slip' || order.paymentMethod === 'promissory_note')) {
      try {
        const customer = await this.userModel.findById(customerId);
        if (customer) {
          // Obter todos os pedidos do cliente
          const customerOrders = await this.orderModel.findByClientId(customerId);
          
          // Calcular o débito total do cliente com base em todos os seus pedidos
          let totalDebt = 0;
          
          for (const customerOrder of customerOrders) {
            if (customerOrder.paymentMethod === 'bank_slip' || customerOrder.paymentMethod === 'promissory_note') {
              // Calcular o valor pago neste pedido
              const orderPaid = customerOrder.paymentHistory 
                ? customerOrder.paymentHistory.reduce((sum, entry) => sum + entry.amount, 0) 
                : 0;
              
              // Adicionar ao débito o valor restante
              if (orderPaid < customerOrder.finalPrice) {
                totalDebt += (customerOrder.finalPrice - orderPaid);
              }
            }
          }
          
          // Atualizar o débito total do cliente
          if (customer.debts !== totalDebt) {
            await this.userModel.update(customerId, {
              debts: totalDebt
            });
          }
        }
      } catch (error) {
        console.error(`Erro ao recalcular débito do cliente ${customerId}:`, error);
      }
    }
  } catch (error) {
    console.error(`Erro ao recalcular status de pagamento do pedido ${orderId}:`, error);
  }
  }

  /**
 * Calcula o débito total de um cliente com base em seus pedidos
 * @param clientId ID do cliente
 * @returns Total de débito do cliente
 */
  private async calculateClientTotalDebt(clientId: string): Promise<number> {
    try {
      // Verificar se o cliente existe
      const client = await this.userModel.findById(clientId);
      if (!client) {
        console.error(`Cliente ${clientId} não encontrado ao calcular débito total`);
        return 0;
      }
      
      // Buscar todos os pedidos ativos (não cancelados) do cliente
      const clientOrders = await this.orderModel.findByClientId(clientId);
      
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
      
      console.log(`Débito total calculado para cliente ${clientId}: ${totalDebt}`);
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
        const client = await this.userModel.findById(clientId);
        if (!client) {
          throw new PaymentError("Cliente não encontrado");
        }

        const oldDebt = client.debts || 0;
        const newDebt = await this.calculateClientTotalDebt(clientId);
        
        // Se houver diferença, atualizar o débito do cliente
        if (newDebt !== oldDebt) {
          await this.userModel.update(clientId, {
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
      const { users } = await this.userModel.findAll(1, 1000, { role: 'customer' });
      
      // Para cada cliente, recalcular o débito total
      for (const client of users) {
        const oldDebt = client.debts || 0;
        const newDebt = await this.calculateClientTotalDebt(client._id);
        
        // Se houver diferença, atualizar o débito do cliente
        if (newDebt !== oldDebt) {
          await this.userModel.update(client._id, {
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
}