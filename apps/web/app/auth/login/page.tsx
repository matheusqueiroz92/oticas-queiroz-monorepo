"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LogoOticasQueiroz from "../../../public/logo-oticas-queiroz-branca.png";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { api } from "../../services/auth";
import Cookies from "js-cookie";
import { AxiosError } from "axios";

// Atualizado para permitir login com email ou CPF
const loginSchema = z.object({
  login: z.string().min(1, "Login é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      console.log("Tentando login com:", { ...data, password: "********" });

      // Chamar a API diretamente com axios para evitar camadas adicionais
      const response = await api.post("/api/auth/login", {
        login: data.login,
        password: data.password,
      });

      console.log("Resposta do login:", response.data);

      if (response.data.token) {
        // Limpar cookies existentes para evitar conflitos
        const cookiesToClear = [
          "token",
          "name",
          "role",
          "userId",
          "email",
          "cpf",
        ];
        for (const cookieName of cookiesToClear) {
          Cookies.remove(cookieName);
        }

        // Definir o cookie token primeiro
        Cookies.set("token", response.data.token, {
          expires: 1,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        // Definir outros cookies
        if (response.data.user) {
          Cookies.set("userId", response.data.user._id, { expires: 1 });
          Cookies.set("name", response.data.user.name, { expires: 1 });
          Cookies.set("role", response.data.user.role, { expires: 1 });

          if (response.data.user.email) {
            Cookies.set("email", response.data.user.email, { expires: 1 });
          }
          if (response.data.user.cpf) {
            Cookies.set("cpf", response.data.user.cpf, { expires: 1 });
          }
        }

        console.log("Login bem-sucedido, cookies definidos");

        // Forçar redirecionamento com window.location para reload completo
        window.location.href = "/dashboard";
      } else {
        console.error("Token não encontrado na resposta");
        setError("Erro no servidor. Token não fornecido.");
      }
    } catch (error) {
      console.error("Erro durante o login:", error);

      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Erro ao fazer login. Verifique suas credenciais."
        );
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-[#2f67ff] relative">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="w-[200px] h-[80px] mx-auto mb-6 relative">
              <Image
                src={LogoOticasQueiroz}
                alt="Óticas Queiroz Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Óticas Queiroz
            </h1>
            <p className="text-white/90 text-lg max-w-md mx-auto">
              Sistema de Gerenciamento
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <h2 className="text-2xl font-bold text-center">Login</h2>
            <p className="text-sm text-muted-foreground text-center">
              Entre com suas credenciais para acessar o sistema
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login" className="text-sm font-medium">
                  Email ou CPF
                </label>
                <Input
                  id="login"
                  type="text"
                  placeholder="seu@email.com ou 000.000.000-00"
                  {...register("login")}
                  className={errors.login ? "border-destructive" : ""}
                />
                {errors.login && (
                  <p className="text-sm text-destructive">
                    {errors.login.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#2f67ff] hover:bg-[#1e40af] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguarde
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Link
              href="/forgot-password"
              className="text-sm text-[#1e3a8a] hover:underline text-center w-full"
            >
              Esqueceu sua senha?
            </Link>
            <div className="text-sm text-center">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-[#1e3a8a] hover:underline">
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
