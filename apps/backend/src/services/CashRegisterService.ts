import { RepositoryFactory } from "../repositories/RepositoryFactory";
import type { ICashRegister } from "../interfaces/ICashRegister";
import type { ICashRegisterRepository } from "../repositories/interfaces/ICashRegisterRepository";
import type { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";
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
  private cashRegisterRepository: ICashRegisterRepository;
  private paymentRepository: IPaymentRepository;
  private exportUtils: ExportUtils;

  constructor() {
    const factory = RepositoryFactory.getInstance();
    this.cashRegisterRepository = factory.getCashRegisterRepository();
    this.paymentRepository = factory.getPaymentRepository();
    this.exportUtils = new ExportUtils();
  }

  private async validateOpenRegister(): Promise<ICashRegister> {
    const register = await this.cashRegisterRepository.findOpenRegister();
    if (!register || !register._id) {
      throw new CashRegisterError("Não há caixa aberto");
    }
    return register;
  }

  private async validateNoOpenRegister(): Promise<void> {
    const register = await this.cashRegisterRepository.findOpenRegister();
    if (register) {
      throw new CashRegisterError("Já existe um caixa aberto");
    }
  }

  private validateBalance(balance: number): void {
    if (balance < 0) {
      throw new CashRegisterError("Valor não pode ser negativo");
    }
  }

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
    const result = await this.cashRegisterRepository.findAll(page, limit, filters);

    return {
      registers: result.items,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async openRegister(data: OpenRegisterInput): Promise<ICashRegister> {
    await this.validateNoOpenRegister();
    this.validateBalance(data.openingBalance);

    const registerData: Omit<ICashRegister, "_id" | "createdAt" | "updatedAt"> = {
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
        check: 0,
      },
      payments: {
        received: 0,
        made: 0,
      },
      openedBy: data.openedBy,
      observations: data.observations,
    };

    const register = await this.cashRegisterRepository.create(registerData);
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
  
    const closedRegister = await this.cashRegisterRepository.closeRegister(
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
    const register = await this.cashRegisterRepository.findOpenRegister();
    if (!register) {
      throw new CashRegisterError("Não há caixa aberto");
    }
    return register;
  }

  async getRegisterById(id: string): Promise<ICashRegister> {
    const register = await this.cashRegisterRepository.findById(id);
    if (!register) {
      throw new CashRegisterError("Caixa não encontrado");
    }
    return register;
  }

  async getRegisterSummary(id: string): Promise<RegisterSummary> {
    try {
      const register = await this.cashRegisterRepository.findById(id);
      if (!register) {
        throw new CashRegisterError("Caixa não encontrado");
      }
  
      // Buscar pagamentos relacionados ao período do caixa
      const startDate = register.openingDate;
      const endDate = register.closingDate || new Date();
      
      const paymentsResult = await this.paymentRepository.findByDateRange(
        startDate,
        endDate
      );

      // Processar dados de pagamentos
      const payments = {
        sales: {
          total: register.sales.total,
          byMethod: {
            cash: register.sales.cash,
            credit: register.sales.credit,
            debit: register.sales.debit,
            pix: register.sales.pix,
            check: register.sales.check
          }
        },
        debts: {
          received: register.payments.received,
          byMethod: {} as Record<string, number>
        },
        expenses: {
          total: register.payments.made,
          byCategory: {} as Record<string, number>
        }
      };

      return {
        register,
        payments
      };
    } catch (error) {
      console.error(`Erro ao obter resumo do caixa ${id}:`, error);
      throw error;
    }
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
    try {
      // Usar findDailySummary do repository
      const summary = await this.cashRegisterRepository.findDailySummary(date);
      
      if (!summary) {
        throw new CashRegisterError("Nenhum dado encontrado para esta data");
      }

      return {
        openingBalance: summary.openingBalance,
        currentBalance: summary.currentBalance,
        totalSales: summary.totalSales,
        totalPaymentsReceived: summary.totalPaymentsReceived,
        totalExpenses: 0, // Será implementado quando integrarmos com payments
        salesByMethod: summary.salesByMethod,
        expensesByCategory: {}, // Será implementado quando integrarmos com payments
      };
    } catch (error) {
      console.error("Erro ao obter resumo diário:", error);
      throw error;
    }
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

  async softDeleteRegister(id: string, userId: string): Promise<ICashRegister> {
    const register = await this.cashRegisterRepository.findById(id);
    if (!register) {
      throw new CashRegisterError("Caixa não encontrado");
    }

    if (register.status === "open") {
      throw new CashRegisterError("Não é possível excluir um caixa aberto");
    }

    const deletedRegister = await this.cashRegisterRepository.softDelete(id, userId);
    if (!deletedRegister) {
      throw new CashRegisterError("Erro ao excluir caixa");
    }

    return deletedRegister;
  }

  async getDeletedRegisters(
    page = 1,
    limit = 10
  ): Promise<{ registers: ICashRegister[]; total: number }> {
    const result = await this.cashRegisterRepository.findAll(page, limit, { includeDeleted: true, isDeleted: true });
    return {
      registers: result.items,
      total: result.total
    };
  }
}
