import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const laboratoryFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  contactName: z
    .string()
    .min(3, "Nome do contato deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone inválido"),
  address: z.object({
    street: z.string().min(3, "Rua deve ter pelo menos 3 caracteres"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro deve ter pelo menos 2 caracteres"),
    city: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
    state: z.string().length(2, "Estado deve ter 2 caracteres (sigla)"),
    zipCode: z
      .string()
      .regex(/^\d{8}$/, "CEP inválido (somente números, 8 dígitos)"),
  }),
  isActive: z.boolean().default(true),
});

export type LaboratoryFormData = z.infer<typeof laboratoryFormSchema>;

export const createLaboratoryForm = () => {
  return useForm<LaboratoryFormData>({
    resolver: zodResolver(laboratoryFormSchema) as any,
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
      isActive: true,
    },
  });
};