import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const userFormSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().optional(),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
    phone: z.string().regex(/^\d{10,11}$/, "Telefone inválido"),
    address: z.string().min(10, "Endereço muito curto"),
    cpf: z.string().regex(/^\d{11}$/, "CPF inválido"),
    rg: z.string().optional(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida"),
    image: z.instanceof(File).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export type UserFormData = z.infer<typeof userFormSchema>;

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