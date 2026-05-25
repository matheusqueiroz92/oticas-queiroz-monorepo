import { z } from "zod";

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

export const sicrediCustomerAddressSchema = z.object({
  logradouro: z.string().trim().min(1, "Logradouro é obrigatório"),
  numero: z.string().trim().min(1, "Número é obrigatório"),
  complemento: z.string().trim().optional(),
  bairro: z.string().trim().min(1, "Bairro é obrigatório"),
  cidade: z.string().trim().min(1, "Cidade é obrigatória"),
  uf: z.string().trim().toUpperCase().length(2, "UF deve ter 2 caracteres"),
  cep: z
    .string()
    .transform((value) => sanitizeDigits(value.trim()))
    .pipe(z.string().min(8, "CEP é obrigatório").max(8, "CEP deve ter 8 dígitos")),
});

export const sicrediEmitFormSchema = z.object({
  cpfCnpj: z
    .string()
    .transform((value) => sanitizeDigits(value.trim()))
    .pipe(z.string().min(11, "CPF/CNPJ é obrigatório").max(14, "CPF/CNPJ inválido")),
  nome: z.string().trim().min(2, "Nome é obrigatório"),
  endereco: sicrediCustomerAddressSchema,
});

export type SicrediEmitFormData = z.infer<typeof sicrediEmitFormSchema>;
