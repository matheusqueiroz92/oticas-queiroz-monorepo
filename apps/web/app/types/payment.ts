export type PaymentMethod =
  | "credit"
  | "debit"
  | "cash"
  | "pix"
  | "check"
  | "bank_slip"
  | "promissory_note"
  | "mercado_pago"
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
  date: Date;
  type: PaymentType;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  mercadoPagoId?: string;
  mercadoPagoData?: Record<string, any>;
  installments?: {
    current: number;
    total: number;
    value: number;
  };
  check?: {
    bank: string,
    checkNumber: string,
    checkDate: Date,
    accountHolder: string,
    branch: string,
    accountNumber: string,
    presentationDate: Date,
    compensationStatus: "pending" | "compensated" | "rejected",
    rejectionReason?: string;
  }
  description?: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;

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
  check?: {
    bank: string,
    checkNumber: string,
    checkDate: Date,
    accountHolder: string,
    branch: string,
    accountNumber: string,
    presentationDate: Date,
    compensationStatus: "pending" | "compensated" | "rejected",
    rejectionReason?: string;
  }
  status: PaymentStatus;
  customerId?: string;
  legacyClientId?: string;
  orderId?: string;
  cashRegisterId?: string;
}
