import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const baseInstitutionSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone inválido").optional(),
  address: z.string().min(10, "Endereço muito curto").optional(),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ inválido"),
  businessName: z.string().min(3, "Razão social deve ter pelo menos 3 caracteres").optional(),
  tradeName: z.string().min(3, "Nome fantasia deve ter pelo menos 3 caracteres").optional(),
  industryType: z.string().optional(),
  contactPerson: z.string().optional(),
  image: z.any().optional(),
});

export const institutionFormSchema = baseInstitutionSchema.extend({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

// Schema para atualização (sem senha)
export const institutionUpdateSchema = baseInstitutionSchema;

export type InstitutionFormData = z.infer<typeof institutionFormSchema>;
export type InstitutionUpdateData = z.infer<typeof institutionUpdateSchema>;

export const createInstitutionForm = () => {
  return useForm<InstitutionFormData>({
    resolver: zodResolver(institutionFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
      cnpj: "",
      businessName: "",
      tradeName: "",
      industryType: "",
      contactPerson: "",
      image: undefined,
    },
  });
};

export const updateInstitutionForm = (initialData?: Partial<InstitutionUpdateData>) => {
  return useForm<InstitutionUpdateData>({
    resolver: zodResolver(institutionUpdateSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      cnpj: initialData?.cnpj || "",
      businessName: initialData?.businessName || "",
      tradeName: initialData?.tradeName || "",
      industryType: initialData?.industryType || "",
      contactPerson: initialData?.contactPerson || "",
      image: initialData?.image,
    },
  });
};