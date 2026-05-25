export interface IUser {
  _id: string;
  name: string;
  email?: string;
  password: string;
  role: "admin" | "employee" | "customer" | "institution";
  image?: string;
  address?: string;
  addressDetails?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  phone?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  birthDate?: Date;
  purchases?: string[];
  debts?: number;
  sales?: string[];
  status?: "active" | "inactive";
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type ICreateUserDTO = Omit<
  IUser,
  "_id" | "createdAt" | "updatedAt" | "comparePassword"
>;
