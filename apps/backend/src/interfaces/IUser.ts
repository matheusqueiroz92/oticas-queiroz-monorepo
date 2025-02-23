export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "customer";
  image?: string; // Novo campo para imagem
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
  comparePassword(candidatePassword: string): Promise<boolean>;
}
