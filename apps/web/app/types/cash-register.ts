import type { Payment } from "./payment";

export interface CashRegister {
  _id: string;
  date: Date | string;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  status: "open" | "closed";
  openedBy: string;
  closedBy?: string;
  totalSales: number;
  totalPayments: number;
  observations?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// app/types/column.ts (adicione às interfaces existentes)
export interface PaymentColumn {
  key: keyof Payment | string;
  header: string;
  render?: (payment: Payment) => React.ReactNode;
}

export interface CashRegisterColumn {
  key: keyof CashRegister | string;
  header: string;
  render?: (cashRegister: CashRegister) => React.ReactNode;
}
