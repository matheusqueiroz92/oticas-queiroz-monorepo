import { getRepositories } from "../repositories/RepositoryFactory";
import type { CreatePaymentDTO } from "../interfaces/IPayment";
import type { IOrderRepository } from "../repositories/interfaces/IOrderRepository";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import type { ILegacyClientRepository } from "../repositories/interfaces/ILegacyClientRepository";
import type { ICashRegisterRepository } from "../repositories/interfaces/ICashRegisterRepository";

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

export class PaymentValidationService {
  private orderRepository: IOrderRepository;
  private userRepository: IUserRepository;
  private legacyClientRepository: ILegacyClientRepository;
  private cashRegisterRepository: ICashRegisterRepository;

  constructor() {
    const { orderRepository, userRepository, legacyClientRepository, cashRegisterRepository } = getRepositories();
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
    this.legacyClientRepository = legacyClientRepository;
    this.cashRegisterRepository = cashRegisterRepository;
  }

  /**
   * Valida o valor do pagamento
   * @param amount Valor do pagamento
   * @throws PaymentValidationError se o valor for inválido
   */
  validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new PaymentValidationError("Valor do pagamento deve ser maior que zero");
    }
  }

  /**
   * Verifica e retorna o caixa aberto
   * @returns ID do caixa aberto
   * @throws PaymentValidationError se não houver caixa aberto
   */
  async validateAndGetOpenRegister(): Promise<string> {
    const openRegister = await this.cashRegisterRepository.findOpenRegister();
    if (!openRegister || !openRegister._id) {
      throw new PaymentValidationError("Não há caixa aberto no momento");
    }
    return openRegister._id;
  }

  /**
   * Valida um pedido
   * @param orderId ID do pedido
   * @throws PaymentValidationError se o pedido não existir ou estiver cancelado
   */
  async validateOrder(orderId?: string): Promise<void> {
    if (!orderId) return;

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new PaymentValidationError("Pedido não encontrado");
    }
    if (order.status === "cancelled") {
      throw new PaymentValidationError(
        "Não é possível registrar pagamento de pedido cancelado"
      );
    }
  }

  /**
   * Valida um cliente
   * @param customerId ID do cliente
   * @throws PaymentValidationError se o cliente não existir
   */
  async validateCustomer(customerId?: string): Promise<void> {
    if (!customerId) return;

    const user = await this.userRepository.findById(customerId);
    if (!user) {
      throw new PaymentValidationError("Cliente não encontrado");
    }
  }

  /**
   * Valida um cliente legado
   * @param legacyClientId ID do cliente legado
   * @throws PaymentValidationError se o cliente legado não existir
   */
  async validateLegacyClient(legacyClientId?: string): Promise<void> {
    if (!legacyClientId) return;

    const legacyClient = await this.legacyClientRepository.findById(legacyClientId);
    if (!legacyClient) {
      throw new PaymentValidationError("Cliente legado não encontrado");
    }
  }

  /**
   * Valida dados de parcelamento
   * @param paymentMethod Método de pagamento
   * @param installments Dados de parcelamento
   * @throws PaymentValidationError se os dados de parcelamento forem inválidos
   */
  validateInstallments(
    paymentMethod: string,
    installments?: { current: number; total: number; value: number }
  ): void {
    if (paymentMethod === "installment") {
      if (!installments) {
        throw new PaymentValidationError(
          "Dados de parcelamento são obrigatórios para pagamento parcelado"
        );
      }
      if (installments.total < 2) {
        throw new PaymentValidationError("Número de parcelas deve ser maior que 1");
      }
      if (installments.value <= 0) {
        throw new PaymentValidationError(
          "Valor da parcela deve ser maior que zero"
        );
      }
      if (installments.current < 1 || installments.current > installments.total) {
        throw new PaymentValidationError(
          "Número da parcela atual deve estar entre 1 e o total de parcelas"
        );
      }
    }
  }

  /**
   * Valida dados de débito ao cliente
   * @param clientDebt Dados de débito
   */
  validateClientDebtData(clientDebt: {
    generateDebt: boolean;
    installments?: { total: number; value: number };
    dueDates?: Date[];
  }): void {
    if (
      !clientDebt.installments ||
      !clientDebt.installments.total ||
      !clientDebt.installments.value
    ) {
      throw new PaymentValidationError(
        "Dados de parcelamento são obrigatórios para débito ao cliente"
      );
    }

    if (!clientDebt.dueDates || clientDebt.dueDates.length === 0) {
      throw new PaymentValidationError(
        "Datas de vencimento são obrigatórias para débito ao cliente"
      );
    }

    if (clientDebt.installments.total !== clientDebt.dueDates.length) {
      throw new PaymentValidationError(
        "O número de datas de vencimento deve ser igual ao número de parcelas"
      );
    }
  }

  /**
   * Valida um pagamento completo
   * @param paymentData Dados do pagamento
   * @returns ID do caixa aberto
   * @throws PaymentValidationError se alguma validação falhar
   */
  async validatePayment(paymentData: CreatePaymentDTO): Promise<string> {
    // Validar valor
    this.validateAmount(paymentData.amount);

    // Validar caixa aberto
    const cashRegisterId = await this.validateAndGetOpenRegister();

    // Validar entidades relacionadas
    await this.validateOrder(paymentData.orderId);
    await this.validateCustomer(paymentData.customerId);
    await this.validateLegacyClient(paymentData.legacyClientId);

    // Validar parcelamentos se aplicável
    if (paymentData.creditCardInstallments && 
        paymentData.creditCardInstallments.current !== undefined && 
        paymentData.creditCardInstallments.value !== undefined) {
      this.validateInstallments("installment", {
        current: paymentData.creditCardInstallments.current,
        total: paymentData.creditCardInstallments.total,
        value: paymentData.creditCardInstallments.value
      });
    }

    // Validar débito ao cliente se aplicável
    if (paymentData.clientDebt?.generateDebt) {
      this.validateClientDebtData(paymentData.clientDebt);
    }

    return cashRegisterId;
  }

  /**
   * Verifica o método de pagamento parcelado
   * @param paymentMethod Método de pagamento
   * @returns True se for método parcelado
   */
  isInstallmentPaymentMethod(paymentMethod: string): boolean {
    return paymentMethod === "credit" || paymentMethod === "installment";
  }

  /**
   * Normaliza o método de pagamento
   * @param paymentMethod Método de pagamento
   * @returns Método normalizado
   */
  normalizePaymentMethod(paymentMethod: string): string {
    const methodMap: Record<string, string> = {
      "cartao_credito": "credit",
      "cartao_debito": "debit",
      "dinheiro": "cash",
      "pix": "pix",
      "boleto": "bank_slip",
      "boleto_sicredi": "sicredi_boleto",
      "promissoria": "promissory_note",
      "cheque": "check"
    };
    
    return methodMap[paymentMethod] || paymentMethod;
  }
} 