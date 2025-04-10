import { z } from "zod";
import { isValidCPF } from "../utils/validators";

export const userSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "employee", "customer"]).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  image: z.string().optional(),
  cpf: z
    .string()
    .min(11, "CPF deve ter pelo menos 11 dígitos")
    .refine((cpf) => isValidCPF(cpf), { message: "CPF inválido" })
    .optional(),
  rg: z.string().optional(),
  birthDate: z
    .string()
    .refine(
      (date) => {
        const parsedDate = new Date(date);
        return (
          parsedDate instanceof Date &&
          !Number.isNaN(parsedDate.getTime()) &&
          parsedDate <= new Date()
        );
      },
      { message: "Data de nascimento inválida ou no futuro" }
    )
    .transform((date) => new Date(date))
    .optional(),
  purchases: z.array(z.string()).optional(),
  debts: z.number().optional(),
  sales: z.array(z.string()).optional(),
});

export type UserType = z.infer<typeof userSchema>;

export const userQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .default(1),
  limit: z
    .union([z.string(), z.number()])
    .transform(val => Number(val))
    .default(10),
  role: z.enum(["admin", "employee", "customer"]).optional(),
  search: z.string().optional(),
  cpf: z.string().optional(),
  serviceOrder: z.string().optional(),
  sort: z.string().optional().default("name") // Ordenação padrão por nome
});

export type UserQueryParams = z.infer<typeof userQuerySchema>;