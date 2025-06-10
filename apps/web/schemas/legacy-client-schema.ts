import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Schema para o endereço
const addressSchema = z.object({
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 letras"),
  zipCode: z.string().length(8, "CEP deve ter 8 dígitos"),
}).optional();

// Schema para criação de cliente legado
export const createLegacyClientSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(11, "CPF deve ter 11 dígitos").optional().or(z.literal("")), // CPF agora é opcional
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone deve ter no mínimo 10 dígitos").optional().or(z.literal("")),
  address: addressSchema,
  totalDebt: z.preprocess(
    (value) => value === "" || value === undefined
      ? 0
      : Number.parseFloat(String(value).replace(",", ".")),
    z.number().min(0, "Valor da dívida não pode ser negativo")
  ),
  status: z.enum(["active", "inactive"] as const).default("active"),
  observations: z.string().optional().or(z.literal("")),
});

// Schema para atualização de cliente legado
export const updateLegacyClientSchema = createLegacyClientSchema.partial();

// Tipos inferidos dos schemas
export type CreateLegacyClientFormData = z.infer<typeof createLegacyClientSchema>;
export type UpdateLegacyClientFormData = z.infer<typeof updateLegacyClientSchema>;

// Hook para criar o formulário de cliente legado
export const createLegacyClientForm = () => {
  return useForm<CreateLegacyClientFormData>({
    resolver: zodResolver(createLegacyClientSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      phone: "",
      totalDebt: 0,
      status: "active",
      observations: "",
    },
  });
};

// Hook para atualizar o formulário de cliente legado
export const updateLegacyClientForm = (initialData?: Partial<UpdateLegacyClientFormData> | null) => {
  return useForm<UpdateLegacyClientFormData>({
    resolver: zodResolver(updateLegacyClientSchema),
    defaultValues: {
      name: initialData?.name || "",
      cpf: initialData?.cpf || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address ? {
        street: initialData.address.street || "",
        number: initialData.address.number || "",
        complement: initialData.address.complement || "",
        neighborhood: initialData.address.neighborhood || "",
        city: initialData.address.city || "",
        state: initialData.address.state || "",
        zipCode: initialData.address.zipCode || "",
      } : undefined,
      totalDebt: initialData?.totalDebt || 0,
      status: initialData?.status || "active",
      observations: initialData?.observations || "",
    },
  });
};