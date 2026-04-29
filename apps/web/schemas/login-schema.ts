import { z } from "zod";

export const loginSchema = z.object({
  login: z.string().min(1, "Login é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;