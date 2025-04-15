import type { User } from "./user";

export interface Institution extends User {
  cnpj?: string;
  businessName?: string;
  tradeName?: string;
  industryType?: string;
  contactPerson?: string;
}