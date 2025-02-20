export interface IPayment {
  _id?: string;
  amount: number;
  date: Date;
  type: "sale" | "debt_payment" | "expense";
  paymentMethod: "credit" | "debit" | "cash" | "pix" | "installment";
  status: "pending" | "completed" | "cancelled";
  installments?: {
    current: number;
    total: number;
    value: number;
  };
  orderId?: string;
  userId?: string;
  legacyClientId?: string;
  categoryId?: string;
  cashRegisterId: string;
  description?: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreatePaymentDTO = Omit<
  IPayment,
  "_id" | "createdAt" | "updatedAt"
>;
export type UpdatePaymentDTO = Partial<
  Omit<IPayment, "_id" | "createdAt" | "updatedAt">
>;
