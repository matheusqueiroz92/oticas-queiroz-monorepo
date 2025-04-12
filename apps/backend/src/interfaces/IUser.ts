export interface IUser {
  _id: string;
  name: string;
  email?: string;
  password: string;
  role: "admin" | "employee" | "customer" | "institution";
  image?: string;
  address?: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  birthDate?: Date;
  purchases?: string[];
  debts?: number;
  sales?: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type ICreateUserDTO = Omit<
  IUser,
  "_id" | "createdAt" | "updatedAt" | "comparePassword"
>;
