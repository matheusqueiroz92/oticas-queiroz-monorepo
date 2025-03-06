export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "customer";
  image?: string;
  address?: string;
  phone?: string;
  cpf: string;
  rg: string;
  birthDate?: Date;
  purchases?: string[];
  debts?: number;
  sales?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
