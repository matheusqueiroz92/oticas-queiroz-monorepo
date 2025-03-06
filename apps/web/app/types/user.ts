export type UserRole = "admin" | "employee" | "customer";

export interface User {
  _id: string;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
  image?: string;
  address?: string;
  phone?: string;
  purchases?: string[]; // IDs das compras (apenas para clientes)
  debts?: number; // Débitos (apenas para clientes)
  sales?: string[]; // IDs das vendas (apenas para funcionários)
}

export interface Column {
  key: keyof User | string; // Chave da coluna (pode ser uma chave de User ou uma chave personalizada)
  header: string; // Cabeçalho da coluna
  render?: (data: User) => React.ReactNode; // Função opcional para renderização personalizada
}
