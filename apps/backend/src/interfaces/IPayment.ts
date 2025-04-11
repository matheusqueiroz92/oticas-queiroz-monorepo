export interface IPayment {
  _id?: string;
  createdBy: string;
  customerId?: string;
  legacyClientId?: string;
  orderId?: string;
  cashRegisterId: string;
  amount: number;
  date: Date;
  type: "sale" | "debt_payment" | "expense";
  paymentMethod:
    | "credit"
    | "debit"
    | "cash"
    | "pix"
    | "bank_slip"
    | "promissory_note";
  status: "pending" | "completed" | "cancelled";

  creditCardInstallments?: {
    current?: number;
    total: number;
    value?: number;
  };

  bank_slip?: {
    code: string;
    bank: string;
  };

  promissoryNote?: {
    number: string;
  };

  clientDebt?: {
    generateDebt: boolean;
    installments?: {
      total: number;
      value: number;
    };
    dueDates?: Date[];
  };

  description?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreatePaymentDTO = Omit<
  IPayment,
  "_id" | "createdAt" | "updatedAt"
>;
