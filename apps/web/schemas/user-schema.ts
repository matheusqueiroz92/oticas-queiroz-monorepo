import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Schema base para todos os usuários
const baseUserSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().optional(),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone inválido").optional(),
  address: z.string().min(10, "Endereço muito curto").optional(),
  rg: z.string().optional(),
  image: z.any().optional(),
});

// Schema para criação que inclui senha e campos obrigatórios
export const userFormSchema = baseUserSchema.extend({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  cpf: z.string().regex(/^\d{11}$/, "CPF inválido"),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

// Schema para atualização (sem senha e campos que não devem ser alterados)
export const userUpdateSchema = baseUserSchema;

export type UserFormData = z.infer<typeof userFormSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;

export const createUserForm = () => {
  return useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
      cpf: "",
      rg: "",
      birthDate: "",
      image: undefined,
    },
  });
};

export const updateUserForm = (initialData?: Partial<UserUpdateData>) => {
  return useForm<UserUpdateData>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      rg: initialData?.rg || "",
      image: initialData?.image,
    },
  });
};