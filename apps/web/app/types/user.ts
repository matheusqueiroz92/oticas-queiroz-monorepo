export type UserRole = "admin" | "employee" | "customer";

export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  address?: string;
  phone?: string;
  prescription?: {
    leftEye: number;
    rightEye: number;
    addition?: number;
  };
  purchases?: string[];
  debts?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
