"use client"; // Marca o componente como Client Component

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../services/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // Importe a biblioteca js-cookie

// Definindo o schema de validação com Zod
const schema = z.object({
  login: z.string().min(1, "Campo obrigatório"),
  password: z.string().min(1, "Campo obrigatório"),
});

// Inferindo o tipo FormData a partir do schema
type FormData = z.infer<typeof schema>;

export default function Login() {
  const router = useRouter();

  // Configurando o useForm com Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Configurando o useMutation para a função de login
  const mutation = useMutation({
    mutationFn: (data: FormData) => login(data.login, data.password),
    onSuccess: (data) => {
      console.log("Login successful:", data);
      // Armazene o token em um cookie
      Cookies.set("token", data.token, {
        expires: 1,
        secure: true,
        sameSite: "strict",
      }); // Expira em 1 dia
      // Redirecione para o dashboard
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  // Função chamada ao enviar o formulário
  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("login")} placeholder="Email ou Username" />
      {errors.login && <span>{errors.login.message}</span>}
      <input {...register("password")} type="password" placeholder="Senha" />
      {errors.password && <span>{errors.password.message}</span>}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Carregando..." : "Entrar"}
      </button>
    </form>
  );
}
