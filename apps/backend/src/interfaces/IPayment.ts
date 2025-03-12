export interface IPayment {
  _id?: string;
  createdBy: string;
  customerId?: string;
  legacyClientId?: string;
  cashRegisterId: string;
  orderId?: string;
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
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Campos de soft delete
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export type CreatePaymentDTO = Omit<
  IPayment,
  "_id" | "createdAt" | "updatedAt"
>;
export type UpdatePaymentDTO = Partial<
  Omit<IPayment, "_id" | "createdAt" | "updatedAt">
>;
