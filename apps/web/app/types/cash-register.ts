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
  // Campos para soft delete
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
