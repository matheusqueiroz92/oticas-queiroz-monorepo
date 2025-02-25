export type UserRole = "admin" | "employee" | "customer";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  address?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
