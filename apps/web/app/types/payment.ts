export type PaymentMethod = "credit" | "debit" | "cash" | "pix" | "installment";
export type PaymentType = "sale" | "debt_payment" | "expense";
export type PaymentStatus = "pending" | "completed" | "cancelled";

export interface IPayment {
  _id: string;
  createdBy: string;
  customerId?: string;
  legacyClientId?: string;
  cashRegisterId: string;
  orderId?: string;
  amount: number;
  date: Date; // Importante: no backend é 'date', não 'paymentDate'
  type: PaymentType;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  installments?: {
    current: number;
    total: number;
    value: number;
  };
  description?: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Campos para soft delete
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface PaymentColumn {
  key: keyof IPayment | string;
  header: string;
  render?: (payment: IPayment) => React.ReactNode;
}

export interface PaymentsResponse {
  payments: IPayment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePaymentDTO {
  amount: number;
  type: PaymentType;
  paymentMethod: PaymentMethod;
  date: Date;
  description?: string;
  category?: string;
  installments?: {
    current: number;
    total: number;
    value: number;
  };
  status: PaymentStatus;
  customerId?: string;
  legacyClientId?: string;
  orderId?: string;
  cashRegisterId?: string;
}
