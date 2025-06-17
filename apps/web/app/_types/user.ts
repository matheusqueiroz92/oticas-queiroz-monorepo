export type UserRole = "admin" | "employee" | "customer" | "institution";

export interface User {
  _id: string;
  name: string;
  email?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  role: UserRole;
  image?: string;
  address?: string;
  phone?: string;
  sales?: string[];
  debts?: number;
  purchases?: string[];
  birthDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Column {
  key: keyof User | string;
  header: string;
  render?: (data: User) => React.ReactNode;
}
