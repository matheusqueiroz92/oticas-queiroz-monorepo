export type UserRole = "admin" | "employee" | "customer";

export interface User {
  _id: string;
  name: string;
  email?: string;
  cpf: string;
  role: UserRole;
  image?: string;
  address?: string;
  phone?: string;
  sales?: string[];
  debts?: number;
  purchases?: string[];
}

export interface Column {
  key: keyof User | string; // Chave da coluna (pode ser uma chave de User ou uma chave personalizada)
  header: string; // Cabeçalho da coluna
  render?: (data: User) => React.ReactNode; // Função opcional para renderização personalizada
}
