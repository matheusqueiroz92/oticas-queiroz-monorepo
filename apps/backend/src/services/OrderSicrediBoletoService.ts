import { getRepositories } from "../repositories/RepositoryFactory";
import { OrderService } from "./OrderService";
import { PaymentService } from "./PaymentService";
import { PaymentValidationService } from "./PaymentValidationService";
import type { IOrder } from "../interfaces/IOrder";
import type { IPayment } from "../interfaces/IPayment";
import type { SicrediCustomerData } from "../validators/sicrediValidators";
import {
  buildEqualInstallmentSchedule,
  resolveSeuNumeroForParcel,
  validateInstallmentSchedule,
  type SicrediInstallmentsPlan,
} from "../utils/sicrediInstallmentUtils";

export class OrderSicrediBoletoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderSicrediBoletoError";
  }
}

export interface EmittedSicrediBoleto {
  payment: IPayment;
  boleto: {
    nossoNumero: string;
    codigoBarras: string;
    linhaDigitavel: string;
    qrCode?: string;
  };
  installmentNumber: number;
  installmentTotal: number;
  alreadyIssued?: boolean;
}

export interface EmitAllParcelasResult {
  boletos: EmittedSicrediBoleto[];
  allAlreadyIssued: boolean;
}

export class OrderSicrediBoletoService {
  private orderService: OrderService;
  private paymentService: PaymentService;
  private paymentValidationService: PaymentValidationService;
  private paymentRepository: ReturnType<typeof getRepositories>["paymentRepository"];
  private cashRegisterRepository: ReturnType<typeof getRepositories>["cashRegisterRepository"];

  constructor() {
    const repositories = getRepositories();
    this.orderService = new OrderService();
    this.paymentService = new PaymentService();
    this.paymentValidationService = new PaymentValidationService();
    this.paymentRepository = repositories.paymentRepository;
    this.cashRegisterRepository = repositories.cashRegisterRepository;
  }

  private async resolveOpenCashRegisterId(cashRegisterId?: string): Promise<string> {
    if (cashRegisterId) {
      const register = await this.cashRegisterRepository.findById(cashRegisterId);
      if (!register || register.status !== "open") {
        throw new OrderSicrediBoletoError(
          "O caixa selecionado não está aberto. Atualize a página ou abra um novo caixa."
        );
      }
      return cashRegisterId;
    }
    return this.paymentValidationService.validateAndGetOpenRegister();
  }

  private resolveRemainingAmount(order: IOrder): number {
    const finalPrice = order.finalPrice ?? order.totalPrice - (order.discount || 0);
    const entry = order.paymentEntry || 0;
    const amount = finalPrice - entry;
    if (amount <= 0) {
      throw new OrderSicrediBoletoError(
        "Valor do boleto deve ser maior que zero. Verifique entrada e desconto do pedido."
      );
    }
    return amount;
  }

  private resolveInstallmentPlan(order: IOrder): SicrediInstallmentsPlan {
    const remaining = this.resolveRemainingAmount(order);

    if (order.sicrediInstallments?.schedule?.length) {
      validateInstallmentSchedule(remaining, order.sicrediInstallments);
      return order.sicrediInstallments;
    }

    const count = order.installments && order.installments > 0 ? order.installments : 1;
    const firstDue = order.deliveryDate
      ? new Date(order.deliveryDate)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return d;
        })();

    return buildEqualInstallmentSchedule(remaining, count, firstDue);
  }

  private async findPaymentForInstallment(
    orderId: string,
    installmentNumber: number
  ): Promise<IPayment | null> {
    const payments = await this.orderService.getOrderPayments(orderId);
    return (
      payments.find(
        (p) =>
          p.paymentMethod === "sicredi_boleto" &&
          p.bank_slip?.sicredi?.installmentNumber === installmentNumber
      ) ?? null
    );
  }

  private async emitSingleParcel(
    order: IOrder,
    orderId: string,
    createdBy: string,
    customerData: SicrediCustomerData,
    installmentNumber: number,
    installmentTotal: number,
    dueDate: Date,
    amount: number,
    cashRegisterId: string
  ): Promise<EmittedSicrediBoleto> {
    let payment = await this.findPaymentForInstallment(orderId, installmentNumber);

    if (payment?.bank_slip?.sicredi?.nossoNumero) {
      return {
        payment,
        boleto: {
          nossoNumero: payment.bank_slip.sicredi.nossoNumero,
          codigoBarras: payment.bank_slip.sicredi.codigoBarras || "",
          linhaDigitavel: payment.bank_slip.sicredi.linhaDigitavel || "",
          qrCode: payment.bank_slip.sicredi.qrCode,
        },
        installmentNumber,
        installmentTotal,
        alreadyIssued: true,
      };
    }

    const clientId =
      typeof order.clientId === "string" ? order.clientId : order.clientId.toString();

    if (!payment) {
      const parcelLabel =
        installmentTotal > 1
          ? `Parcela ${installmentNumber}/${installmentTotal}`
          : "Boleto SICREDI";
      payment = await this.paymentService.createPayment({
        createdBy,
        customerId: clientId,
        orderId,
        cashRegisterId,
        amount,
        date: new Date(),
        type: "sale",
        paymentMethod: "sicredi_boleto",
        status: "pending",
        description: order.serviceOrder
          ? `O.S. ${order.serviceOrder} - ${parcelLabel}`
          : `${parcelLabel} - Oticas Queiroz`,
        bank_slip: {
          sicredi: {
            dataVencimento: dueDate,
            status: "REGISTRADO",
            installmentNumber,
            installmentTotal,
          },
        },
      });
    } else {
      await this.paymentRepository.update(payment._id!, {
        amount,
        bank_slip: {
          ...payment.bank_slip,
          sicredi: {
            ...payment.bank_slip?.sicredi,
            dataVencimento: dueDate,
            installmentNumber,
            installmentTotal,
          },
        },
      });
      payment = (await this.paymentRepository.findById(payment._id!))!;
    }

    const seuNumero = resolveSeuNumeroForParcel(
      order.serviceOrder,
      payment._id!,
      installmentNumber
    );
    const mensagem =
      installmentTotal > 1
        ? [
            order.serviceOrder
              ? `O.S. ${order.serviceOrder} - Parcela ${installmentNumber}/${installmentTotal}`
              : `Parcela ${installmentNumber}/${installmentTotal} - Oticas Queiroz`,
          ]
        : order.serviceOrder
          ? [`O.S. ${order.serviceOrder} - Oticas Queiroz`]
          : ["Pagamento - Oticas Queiroz"];

    const result = await this.paymentService.generateSicrediBoleto(
      payment._id!,
      customerData,
      {
        seuNumero,
        mensagem,
        dataVencimento: dueDate.toISOString().split("T")[0],
      }
    );

    if (!result.success || !result.data) {
      throw new OrderSicrediBoletoError(
        result.error || `Erro ao gerar boleto da parcela ${installmentNumber}`
      );
    }

    const updatedPayment = await this.paymentRepository.findById(payment._id!);
    if (!updatedPayment) {
      throw new OrderSicrediBoletoError("Pagamento não encontrado após emissão do boleto");
    }

    return {
      payment: updatedPayment,
      boleto: result.data,
      installmentNumber,
      installmentTotal,
    };
  }

  async emitAllParcelasForOrder(
    orderId: string,
    createdBy: string,
    customerData: SicrediCustomerData,
    cashRegisterId?: string
  ): Promise<EmitAllParcelasResult> {
    const order = await this.orderService.getOrderById(orderId);

    if (order.paymentMethod !== "sicredi_boleto") {
      throw new OrderSicrediBoletoError(
        "Este pedido não utiliza a forma de pagamento Boleto SICREDI"
      );
    }

    const plan = this.resolveInstallmentPlan(order);
    const resolvedCashRegisterId = await this.resolveOpenCashRegisterId(cashRegisterId);
    const boletos: EmittedSicrediBoleto[] = [];

    for (let i = 0; i < plan.schedule.length; i++) {
      const item = plan.schedule[i];
      const installmentNumber = i + 1;
      const emitted = await this.emitSingleParcel(
        order,
        orderId,
        createdBy,
        customerData,
        installmentNumber,
        plan.total,
        new Date(item.dueDate),
        item.amount,
        resolvedCashRegisterId
      );
      boletos.push(emitted);
    }

    return {
      boletos,
      allAlreadyIssued: boletos.every((b) => b.alreadyIssued),
    };
  }

  /** Retrocompat: emite todas as parcelas e retorna a primeira (ou única). */
  async emitBoletoForOrder(
    orderId: string,
    createdBy: string,
    customerData: SicrediCustomerData,
    dataVencimento?: Date,
    cashRegisterId?: string
  ): Promise<{
    payment: IPayment;
    boleto: {
      nossoNumero: string;
      codigoBarras: string;
      linhaDigitavel: string;
      qrCode?: string;
    };
    alreadyIssued?: boolean;
    boletos?: EmittedSicrediBoleto[];
  }> {
    if (dataVencimento) {
      const order = await this.orderService.getOrderById(orderId);
      const remaining = this.resolveRemainingAmount(order);
      order.sicrediInstallments = {
        total: 1,
        schedule: [{ dueDate: dataVencimento, amount: remaining }],
      };
    }

    const result = await this.emitAllParcelasForOrder(
      orderId,
      createdBy,
      customerData,
      cashRegisterId
    );

    const first = result.boletos[0];
    if (!first) {
      throw new OrderSicrediBoletoError("Nenhum boleto foi emitido");
    }

    return {
      payment: first.payment,
      boleto: first.boleto,
      alreadyIssued: result.allAlreadyIssued,
      boletos: result.boletos,
    };
  }

  async getOrderSicrediPayments(orderId: string): Promise<IPayment[]> {
    const payments = await this.orderService.getOrderPayments(orderId);
    return payments
      .filter((p) => p.paymentMethod === "sicredi_boleto")
      .sort(
        (a, b) =>
          (a.bank_slip?.sicredi?.installmentNumber ?? 0) -
          (b.bank_slip?.sicredi?.installmentNumber ?? 0)
      );
  }
}
