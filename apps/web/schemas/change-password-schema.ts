import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Schema de validação para alteração de senha
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(6, "A nova senha deve ter pelo menos 6 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "A nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número"
      ),
    confirmPassword: z
      .string()
      .min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "A nova senha deve ser diferente da senha atual",
    path: ["newPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const changePasswordForm = () => {
  return useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validação em tempo real
  });
};