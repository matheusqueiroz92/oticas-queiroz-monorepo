export interface LegacyClient {
  _id?: string;
  name: string;
  identifier: string; // CPF/CNPJ
  phone?: string;
  address?: string;
  totalDebt: number;
  lastPaymentDate?: Date | string;
  status: "active" | "inactive";
  observations?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  
  paymentHistory?: Array<{
    date: Date | string;
    amount: number;
    paymentId: string;
  }>;
}