export interface LegacyClient {
  _id: string;
  name: string;
  cpf: string;
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
  totalDebt: number;
  lastPayment?: {
    date: Date;
    amount: number;
  };
  paymentHistory: Array<{
    date: Date;
    amount: number;
    paymentId: string;
  }>;
  status: "active" | "inactive";
  observations?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LegacyClientColumn {
  key: keyof LegacyClient | string;
  header: string;
  render?: (legacyClient: LegacyClient) => React.ReactNode;
}

export interface CreateLegacyClientDTO {
  name: string;
  cpf: string;
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
  totalDebt: number;
  status?: "active" | "inactive";
  observations?: string;
}

export interface UpdateLegacyClientDTO {
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  totalDebt?: number;
  status?: "active" | "inactive";
  observations?: string;
}

export type LegacyClientStatus = "active" | "inactive";