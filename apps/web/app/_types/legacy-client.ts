export interface LegacyClient {
  _id?: string;
  name: string;
  identifier?: string; // CPF/CNPJ
  cpf?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  debt?: number; // Dívida atual
  totalDebt: number; // Dívida total
  lastPayment?: {
    date: Date;
    amount: number;
  };
  paymentHistory?: Array<{
    date: Date;
    amount: number;
    paymentId: string;
  }>;
  status: "active" | "inactive";
  observations?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}