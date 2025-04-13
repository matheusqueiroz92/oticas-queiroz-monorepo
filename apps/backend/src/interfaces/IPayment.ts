export interface IPayment {
  _id?: string;
  createdBy: string;
  customerId?: string;
  institutionId?: string;
  isInstitutionalPayment?: boolean;
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
    | "promissory_note"
    | "check";
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

  check?: {
    bank: string;
    checkNumber: string;
    checkDate: Date; // Data do cheque
    accountHolder: string; // Nome do titular da conta
    branch: string; // Agência bancária
    accountNumber: string; // Número da conta
    presentationDate?: Date; // Data para apresentação (para cheques pré-datados)
    compensationStatus: "pending" | "compensated" | "rejected"; // Status de compensação
    rejectionReason?: string; // Razão da rejeição, se aplicável
  }

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
