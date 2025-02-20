"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../services/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card } from "../../../components/ui/card";

// Definindo o schema de validação com Zod
const schema = z.object({
  email: z.string().email("Email inválido").min(1, "Campo obrigatório"),
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
    mutationFn: (data: FormData) => login(data.email, data.password),
    onSuccess: (data) => {
      console.log("Login successful:", data);
      // Armazene o token em um cookie
      Cookies.set("token", data.token, {
        expires: 1,
        secure: true,
        sameSite: "strict",
      });
      // Redirecione para o dashboard
      router.push("/dashboard");
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onError: (error: { message: string; response?: { data: any } }) => {
      console.error("Login failed:", error.message);
      console.error("Detalhes do erro:", error.response?.data);
    },
  });

  // Função chamada ao enviar o formulário
  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Parte Esquerda: Imagem de Fundo */}
      <div
        className="lg:w-1/2 bg-cover bg-center hidden lg:block"
        style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
      >
        <div className="h-full bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-white text-4xl font-bold">Óticas Queiroz</h1>
        </div>
      </div>

      {/* Parte Direita: Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--accent-white)]">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-center text-[var(--primary-blue)]">
            Login
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className="mt-1 w-full"
                placeholder="Digite seu email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="mt-1 w-full"
                placeholder="Digite sua senha"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--primary-blue)] hover:bg-blue-800"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Carregando..." : "Entrar"}
            </Button>

            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-[var(--primary-blue)] hover:underline"
              >
                Esqueci minha senha
              </a>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">Não tem uma conta? </span>
              <a
                href="/register"
                className="text-sm text-[var(--primary-blue)] hover:underline"
              >
                Cadastrar-se
              </a>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
