import { PaymentModel } from "../models/PaymentModel";
import { CashRegisterModel } from "../models/CashRegisterModel";
import { OrderModel } from "../models/OrderModel";
import { UserModel } from "../models/UserModel";
import { LegacyClientModel } from "../models/LegacyClientModel";
import type { IPayment, CreatePaymentDTO } from "../interfaces/IPayment";

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

export class PaymentService {
  private paymentModel: PaymentModel;
  private cashRegisterModel: CashRegisterModel;
  private orderModel: OrderModel;
  private userModel: UserModel;
  private legacyClientModel: LegacyClientModel;

  constructor() {
    this.paymentModel = new PaymentModel();
    this.cashRegisterModel = new CashRegisterModel();
    this.orderModel = new OrderModel();
    this.userModel = new UserModel();
    this.legacyClientModel = new LegacyClientModel();
  }

  private async validatePayment(paymentData: CreatePaymentDTO): Promise<void> {
    const openRegister = await this.cashRegisterModel.findOpenRegister();
    if (!openRegister) {
      throw new PaymentError("Não há caixa aberto no momento");
    }

    if (paymentData.type === "sale" && paymentData.orderId) {
      const order = await this.orderModel.findById(paymentData.orderId);
      if (!order) {
        throw new PaymentError("Pedido não encontrado");
      }
      if (order.status === "cancelled") {
        throw new PaymentError(
          "Não é possível registrar pagamento de pedido cancelado"
        );
      }
    }

    if (paymentData.userId) {
      const user = await this.userModel.findById(paymentData.userId);
      if (!user) {
        throw new PaymentError("Cliente não encontrado");
      }
    }

    if (paymentData.legacyClientId) {
      const legacyClient = await this.legacyClientModel.findById(
        paymentData.legacyClientId
      );
      if (!legacyClient) {
        throw new PaymentError("Cliente legado não encontrado");
      }
    }

    if (paymentData.amount <= 0) {
      throw new PaymentError("Valor do pagamento deve ser maior que zero");
    }

    if (paymentData.paymentMethod === "installment") {
      if (!paymentData.installments) {
        throw new PaymentError(
          "Dados de parcelamento são obrigatórios para pagamento parcelado"
        );
      }
      if (paymentData.installments.total < 2) {
        throw new PaymentError("Número de parcelas deve ser maior que 1");
      }
      if (paymentData.installments.value <= 0) {
        throw new PaymentError("Valor da parcela deve ser maior que zero");
      }
    }
  }

  async createPayment(paymentData: CreatePaymentDTO): Promise<IPayment> {
    await this.validatePayment(paymentData);

    const openRegister = await this.cashRegisterModel.findOpenRegister();
    if (!openRegister?._id) {
      throw new PaymentError("Não há caixa aberto");
    }

    const payment = await this.paymentModel.create({
      ...paymentData,
      cashRegisterId: openRegister._id,
      status: "completed",
    });

    await this.cashRegisterModel.updateSalesAndPayments(
      openRegister._id,
      payment.type,
      payment.amount,
      payment.paymentMethod === "installment" ? "credit" : payment.paymentMethod
    );

    if (payment.type === "debt_payment") {
      const debtAmount = -payment.amount;

      if (payment.userId) {
        const user = await this.userModel.findById(payment.userId);
        if (user) {
          const currentDebt = user.debts || 0;
          await this.userModel.update(payment.userId, {
            debts: currentDebt + debtAmount,
          });
        }
      } else if (payment.legacyClientId) {
        await this.legacyClientModel.updateDebt(
          payment.legacyClientId,
          debtAmount,
          payment._id
        );
      }
    }

    return payment;
  }

  async getPaymentById(id: string): Promise<IPayment> {
    const payment = await this.paymentModel.findById(id, true);
    if (!payment) {
      throw new PaymentError("Pagamento não encontrado");
    }
    return payment;
  }

  async getAllPayments(
    page?: number,
    limit?: number,
    filters: Partial<IPayment> = {}
  ): Promise<{ payments: IPayment[]; total: number }> {
    const result = await this.paymentModel.findAll(page, limit, filters, true);
    if (!result.payments.length) {
      throw new PaymentError("Nenhum pagamento encontrado");
    }
    return result;
  }

  async getDailyPayments(
    date: Date,
    type?: IPayment["type"]
  ): Promise<IPayment[]> {
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
    return result.payments;
  }

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

    await this.cashRegisterModel.updateSalesAndPayments(
      payment.cashRegisterId,
      payment.type,
      -payment.amount,
      payment.paymentMethod === "installment" ? "credit" : payment.paymentMethod
    );

    if (payment.type === "debt_payment") {
      const debtAmount = payment.amount;

      if (payment.userId) {
        const user = await this.userModel.findById(payment.userId);
        if (user) {
          const currentDebt = user.debts || 0;
          await this.userModel.update(payment.userId, {
            debts: currentDebt + debtAmount,
          });
        }
      } else if (payment.legacyClientId) {
        await this.legacyClientModel.updateDebt(
          payment.legacyClientId,
          debtAmount
        );
      }
    }

    const updatedPayment = await this.paymentModel.updateStatus(
      id,
      "cancelled"
    );
    if (!updatedPayment) {
      throw new PaymentError("Erro ao cancelar pagamento");
    }

    return updatedPayment;
  }
}
