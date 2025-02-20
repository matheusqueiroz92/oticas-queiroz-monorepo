import { CashRegisterModel } from "../models/CashRegisterModel";
import { PaymentModel } from "../models/PaymentModel";
import type { ICashRegister } from "../interfaces/ICashRegister";
import type { IPayment } from "../interfaces/IPayment";

export class CashRegisterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CashRegisterError";
  }
}

type OpenRegisterInput = {
  openingBalance: number;
  openedBy: string;
  observations?: string;
};

type CloseRegisterInput = {
  closingBalance: number;
  closedBy: string;
  observations?: string;
};

interface RegisterSummary {
  register: ICashRegister;
  payments: {
    sales: {
      total: number;
      byMethod: Record<string, number>;
    };
    debts: {
      received: number;
      byMethod: Record<string, number>;
    };
    expenses: {
      total: number;
      byCategory: Record<string, number>;
    };
  };
}

export class CashRegisterService {
  private cashRegisterModel: CashRegisterModel;
  private paymentModel: PaymentModel;

  constructor() {
    this.cashRegisterModel = new CashRegisterModel();
    this.paymentModel = new PaymentModel();
  }

  async openRegister(data: OpenRegisterInput): Promise<ICashRegister> {
    const openRegister = await this.cashRegisterModel.findOpenRegister();
    if (openRegister) {
      throw new CashRegisterError("Já existe um caixa aberto");
    }

    if (data.openingBalance < 0) {
      throw new CashRegisterError("Valor inicial não pode ser negativo");
    }

    const registerData: Omit<ICashRegister, "_id" | "createdAt" | "updatedAt"> =
      {
        openingDate: new Date(),
        openingBalance: data.openingBalance,
        currentBalance: data.openingBalance,
        status: "open",
        sales: {
          total: 0,
          cash: 0,
          credit: 0,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 0,
          made: 0,
        },
        openedBy: data.openedBy,
        observations: data.observations,
      };

    return this.cashRegisterModel.create(registerData);
  }

  async closeRegister(data: CloseRegisterInput): Promise<ICashRegister> {
    const openRegister = await this.cashRegisterModel.findOpenRegister();
    if (!openRegister || !openRegister._id) {
      throw new CashRegisterError("Não há caixa aberto");
    }

    const difference = data.closingBalance - openRegister.currentBalance;
    const observations = [
      data.observations,
      `Diferença de caixa: ${difference.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}`,
    ]
      .filter(Boolean)
      .join("\n");

    const closedRegister = await this.cashRegisterModel.closeRegister(
      openRegister._id,
      {
        closingBalance: data.closingBalance,
        closedBy: data.closedBy,
        observations,
      }
    );

    if (!closedRegister) {
      throw new CashRegisterError("Erro ao fechar o caixa");
    }

    return closedRegister;
  }

  async getCurrentRegister(): Promise<ICashRegister> {
    const register = await this.cashRegisterModel.findOpenRegister();
    if (!register) {
      throw new CashRegisterError("Não há caixa aberto");
    }
    return register;
  }

  async getRegisterById(id: string): Promise<ICashRegister> {
    const register = await this.cashRegisterModel.findById(id);
    if (!register) {
      throw new CashRegisterError("Caixa não encontrado");
    }
    return register;
  }

  async getRegisterSummary(id: string): Promise<RegisterSummary> {
    const register = await this.cashRegisterModel.findById(id);
    if (!register) {
      throw new CashRegisterError("Caixa não encontrado");
    }

    const payments = await this.paymentModel.findByCashRegister(id);

    const summary: RegisterSummary = {
      register,
      payments: {
        sales: {
          total: 0,
          byMethod: {},
        },
        debts: {
          received: 0,
          byMethod: {},
        },
        expenses: {
          total: 0,
          byCategory: {},
        },
      },
    };

    for (const payment of payments) {
      if (payment.type === "sale") {
        summary.payments.sales.total += payment.amount;
        summary.payments.sales.byMethod[payment.paymentMethod] =
          (summary.payments.sales.byMethod[payment.paymentMethod] || 0) +
          payment.amount;
      } else if (payment.type === "debt_payment") {
        summary.payments.debts.received += payment.amount;
        summary.payments.debts.byMethod[payment.paymentMethod] =
          (summary.payments.debts.byMethod[payment.paymentMethod] || 0) +
          payment.amount;
      } else if (payment.type === "expense") {
        summary.payments.expenses.total += payment.amount;
        const categoryName = payment.categoryId || "outros";
        summary.payments.expenses.byCategory[categoryName] =
          (summary.payments.expenses.byCategory[categoryName] || 0) +
          payment.amount;
      }
    }

    return summary;
  }

  async getDailySummary(date: Date): Promise<{
    openingBalance: number;
    currentBalance: number;
    totalSales: number;
    totalPaymentsReceived: number;
    totalExpenses: number;
    salesByMethod: Record<string, number>;
    expensesByCategory: Record<string, number>;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const registers = await this.cashRegisterModel.findByDateRange(
      startOfDay,
      endOfDay
    );
    if (!registers.length) {
      throw new CashRegisterError("Nenhum caixa encontrado para esta data");
    }

    const summary = {
      openingBalance: 0,
      currentBalance: 0,
      totalSales: 0,
      totalPaymentsReceived: 0,
      totalExpenses: 0,
      salesByMethod: {} as Record<string, number>,
      expensesByCategory: {} as Record<string, number>,
    };

    for (const register of registers) {
      summary.openingBalance += register.openingBalance;
      summary.currentBalance += register.currentBalance;
      summary.totalSales += register.sales.total;
      summary.totalPaymentsReceived += register.payments.received;

      for (const [method, value] of Object.entries(register.sales)) {
        if (method !== "total") {
          summary.salesByMethod[method] =
            (summary.salesByMethod[method] || 0) + value;
        }
      }
    }

    // Buscar pagamentos do tipo despesa para o período
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const payments = await this.paymentModel.findAll(1, 1000, {
      type: "expense",
      date: {
        $gte: startDate,
        $lte: endDate,
      } as unknown as Date,
    });

    for (const payment of payments.payments) {
      summary.totalExpenses += payment.amount;
      const categoryName = payment.categoryId || "outros";
      summary.expensesByCategory[categoryName] =
        (summary.expensesByCategory[categoryName] || 0) + payment.amount;
    }

    return summary;
  }
}
