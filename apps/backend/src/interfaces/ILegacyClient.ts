export interface ILegacyClient {
  _id?: string;
  name: string;
  cpf?: string; // CPF agora é opcional
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

// Também vou criar um tipo para o input de criação
export type CreateLegacyClientDTO = Omit<
  ILegacyClient,
  "_id" | "paymentHistory" | "lastPayment" | "createdAt" | "updatedAt"
> & {
  totalDebt: number;
  status?: "active" | "inactive";
};

// E um tipo para atualização
export type UpdateLegacyClientDTO = Partial<
  Omit<
    ILegacyClient,
    "_id" | "paymentHistory" | "lastPayment" | "createdAt" | "updatedAt"
  >
>;
