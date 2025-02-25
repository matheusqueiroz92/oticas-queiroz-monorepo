import type { User } from "./user";

export interface Customer extends User {
  debts?: number;
  purchases?: string[]; // IDs dos pedidos realizados pelo cliente
}
