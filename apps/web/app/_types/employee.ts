import type { User } from "./user";

export interface Employee extends User {
  sales?: string[]; // IDs das vendas realizadas pelo funcionário
}
