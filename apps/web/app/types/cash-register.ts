export interface ICashRegister {
  _id: string;
  openingDate: Date;
  closingDate?: Date;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  status: "open" | "closed";
  sales: {
    total: number;
    cash: number;
    credit: number;
    debit: number;
    pix: number;
  };
  payments: {
    received: number;
    made: number;
  };
  openedBy: string;
  closedBy?: string;
  observations?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface CashRegisterColumn {
  key: keyof ICashRegister | string;
  header: string;
  render?: (cashRegister: ICashRegister) => React.ReactNode;
}

export interface CashRegisterResponse {
  cashRegisters: ICashRegister[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OpenCashRegisterDTO {
  openingBalance: number;
  observations?: string;
  openingDate?: Date;
}

export interface CloseCashRegisterDTO {
  closingBalance: number;
  observations?: string;
}

export interface CashRegisterFilters {
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface CashRegisterCheckResult {
  isOpen: boolean;
  data: ICashRegister | null;
  error?: string;
}

export interface CashRegisterSummary {
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
