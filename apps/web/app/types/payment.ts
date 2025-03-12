export type PaymentMethod = "cash" | "credit" | "debit" | "pix" | "installment";
export type PaymentType = "sale" | "debt_payment" | "expense";
export type PaymentStatus = "pending" | "completed" | "cancelled";

export interface Payment {
  _id: string;
  createdBy?: string;
  customerId?: string;
  legacyClientId?: string;
  cashRegisterId: string;
  orderId?: string;
  amount: number;
  paymentDate: Date;
  type: "sale" | "debt_payment" | "expense";
  paymentMethod: "credit" | "debit" | "cash" | "pix" | "check";
  installments?: {
    current: number;
    total: number;
    value: number;
  };
  status: "pending" | "completed" | "cancelled";
  description?: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
