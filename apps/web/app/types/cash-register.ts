export interface CashRegister {
  _id?: string;
  date: Date;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  status: "open" | "closed";
  openedBy: string;
  closedBy?: string;
  totalSales: number;
  totalPayments: number;
  observations?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
