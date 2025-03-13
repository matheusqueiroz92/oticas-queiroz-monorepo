import { CashRegisterModel } from "../models/CashRegisterModel";
import { PaymentModel } from "../models/PaymentModel";
import type { ICashRegister } from "../interfaces/ICashRegister";
import NodeCache from "node-cache";
import { type ExportOptions, ExportUtils } from "../utils/exportUtils";

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
  private cache: NodeCache;
  private exportUtils: ExportUtils;

  constructor() {
    this.cashRegisterModel = new CashRegisterModel();
    this.paymentModel = new PaymentModel();
    this.cache = new NodeCache({ stdTTL: 300 });
    this.exportUtils = new ExportUtils();
  }

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
   * Valida se há um caixa aberto
   * @throws CashRegisterError se não houver caixa aberto
   * @returns O caixa aberto
   */
  private async validateOpenRegister(): Promise<ICashRegister> {
    const register = await this.cashRegisterModel.findOpenRegister();
    if (!register || !register._id) {
      throw new CashRegisterError("Não há caixa aberto");
    }
    return register;
  }

  /**
   * Valida se não há um caixa aberto
   * @throws CashRegisterError se houver caixa aberto
   */
  private async validateNoOpenRegister(): Promise<void> {
    const register = await this.cashRegisterModel.findOpenRegister();
    if (register) {
      throw new CashRegisterError("Já existe um caixa aberto");
    }
  }

  /**
   * Valida o valor do saldo inicial
   * @param balance Valor do saldo
   * @throws CashRegisterError se o valor for negativo
   */
  private validateBalance(balance: number): void {
    if (balance < 0) {
      throw new CashRegisterError("Valor não pode ser negativo");
    }
  }

  /**
   * Obtém todos os registros de caixa com opções de filtro e paginação
   * @param page Número da página
   * @param limit Limite de itens por página
   * @param filters Filtros adicionais
   * @returns Lista paginada de registros e informações de paginação
   */
  async getAllRegisters(
    page = 1,
    limit = 10,
    filters: Record<string, unknown> = {}
  ): Promise<{
    registers: ICashRegister[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.cashRegisterModel.findAll(page, limit, filters);

    return {
      registers: result.registers,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async openRegister(data: OpenRegisterInput): Promise<ICashRegister> {
    await this.validateNoOpenRegister();
    this.validateBalance(data.openingBalance);

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

    const register = await this.cashRegisterModel.create(registerData);
    this.invalidateCache("current_register");

    return register;
  }

  async closeRegister(data: CloseRegisterInput): Promise<ICashRegister> {
    const openRegister = await this.validateOpenRegister();
    this.validateBalance(data.closingBalance);

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

    this.invalidateCache(["current_register", `register_${openRegister._id}`]);

    return closedRegister;
  }

  async getCurrentRegister(): Promise<ICashRegister> {
    const cacheKey = "current_register";

    const cachedRegister = this.cache.get<ICashRegister>(cacheKey);
    if (cachedRegister) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedRegister;
    }

    const register = await this.cashRegisterModel.findOpenRegister();
    if (!register) {
      throw new CashRegisterError("Não há caixa aberto");
    }

    this.cache.set(cacheKey, register);

    return register;
  }

  async getRegisterById(id: string): Promise<ICashRegister> {
    const cacheKey = `register_${id}`;

    const cachedRegister = this.cache.get<ICashRegister>(cacheKey);
    if (cachedRegister) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedRegister;
    }

    const register = await this.cashRegisterModel.findById(id);
    if (!register) {
      throw new CashRegisterError("Caixa não encontrado");
    }

    this.cache.set(cacheKey, register);

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
    }

    return summary;
  }

  async exportRegisterSummary(
    id: string,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const summary = await this.getRegisterSummary(id);

    return this.exportUtils.exportCashRegisterSummary(summary, options);
  }

  async exportDailySummary(
    date: Date,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const summary = await this.getDailySummary(date);

    return this.exportUtils.exportDailySummary(summary, options);
  }

  /**
   * Realiza exclusão lógica (soft delete) de um registro de caixa
   * @param id ID do registro de caixa
   * @param userId ID do usuário que está realizando a exclusão
   * @returns Registro de caixa marcado como excluído
   * @throws CashRegisterError se o caixa não for encontrado ou estiver aberto
   */
  async softDeleteRegister(id: string, userId: string): Promise<ICashRegister> {
    const register = await this.cashRegisterModel.findById(id);
    if (!register) {
      throw new CashRegisterError("Caixa não encontrado");
    }

    if (register.status === "open") {
      throw new CashRegisterError("Não é possível excluir um caixa aberto");
    }

    const deletedRegister = await this.cashRegisterModel.softDelete(id, userId);
    if (!deletedRegister) {
      throw new CashRegisterError("Erro ao excluir caixa");
    }

    this.invalidateCache([`register_${id}`, "daily_summary"]);

    return deletedRegister;
  }

  /**
   * Obtém registros de caixa que foram excluídos logicamente
   * @param page Número da página
   * @param limit Limite de itens por página
   * @returns Lista paginada de registros excluídos e total
   */
  async getDeletedRegisters(
    page = 1,
    limit = 10
  ): Promise<{ registers: ICashRegister[]; total: number }> {
    return this.cashRegisterModel.findDeletedRegisters(page, limit);
  }
}
