export type PaymentMethod = "cash" | "credit" | "debit" | "pix" | "installment";
export type PaymentType = "sale" | "debt_payment" | "expense";
export type PaymentStatus = "pending" | "completed" | "cancelled";

export interface Payment {
  _id: string;
  amount: number;
  paymentDate: Date;
  type: "sale" | "debt_payment" | "expense";
  paymentMethod: "credit" | "debit" | "cash" | "pix";
  installments?: number;
  status: "pending" | "completed" | "cancelled";
  orderId?: string;
  customerId?: string;
  employeeId?: string;
  legacyClientId?: string;
  cashRegisterId: string;
  description?: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
