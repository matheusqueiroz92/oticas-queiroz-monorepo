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
    | "check"
    | "mercado_pago"
    | "sicredi_boleto";
  status: "pending" | "completed" | "cancelled";

  mercadoPagoId?: string;
  mercadoPagoData?: Record<string, any>;

  creditCardInstallments?: {
    current?: number;
    total: number;
    value?: number;
  };

  bank_slip?: {
    code?: string;
    bank?: string;
    sicredi?: {
      nossoNumero?: string;
      codigoBarras?: string;
      linhaDigitavel?: string;
      pdfUrl?: string;
      qrCode?: string;
      status?: "REGISTRADO" | "BAIXADO" | "PAGO" | "VENCIDO" | "PROTESTADO" | "CANCELADO";
      dataVencimento?: Date;
      dataPagamento?: Date;
      dataBaixa?: Date;
      valorPago?: number;
      motivoCancelamento?: string;
    };
  };

  promissoryNote?: {
    number: string;
  };

  check?: {
    bank: string;
    checkNumber: string;
    checkDate: Date;
    accountHolder: string;
    branch: string;
    accountNumber: string;
    presentationDate?: Date;
    compensationStatus: "pending" | "compensated" | "rejected";
    rejectionReason?: string;
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