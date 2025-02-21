export interface LegacyClient {
  _id?: string;
  name: string;
  identifier: string; // CPF/CNPJ
  phone?: string;
  address?: string;
  totalDebt: number;
  lastPaymentDate?: Date;
  status: "active" | "inactive";
  observations?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
