"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import LogoOticasQueiroz from "@/public/logo-oticas-queiroz-branca-2.png";
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
import { api } from "@/app/_services/authService";
import Cookies from "js-cookie";
import axios from "axios";
import { LoginFormData, loginSchema } from "@/schemas/login-schema";
import { API_ROUTES } from "@/app/_constants/api-routes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import AppFooterAuth from "@/components/layout/app-footer-auth";

export default function LoginPage() {
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

      const response = await api.post(API_ROUTES.LOGIN, {
        login: data.login,
        password: data.password,
      });

      if (response && response.data && response.data.token) {
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

        Cookies.set("token", response.data.token, {
          expires: 1,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

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

        window.location.href = "/dashboard";
      } else {
        console.error("Token não encontrado na resposta");
        setError("Erro no servidor. Token não fornecido.");
      }
    } catch (error) {
      console.error("Erro durante o login:", error);

      // Verificar se é um erro do Axios
      if (axios.isAxiosError(error)) {
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
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-background relative">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Logo no topo em mobile, em coluna fixa em desktop */}
      <div className="lg:hidden bg-[var(--primary-blue)] px-4 py-6 sm:py-8 flex items-center justify-center">
        <div className="relative h-16 w-44 sm:h-20 sm:w-56">
          <Image
            src={LogoOticasQueiroz}
            alt="Óticas Queiroz Logo"
            fill
            sizes="(max-width: 640px) 176px, 224px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Logo centralizado em desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary-blue)] relative">
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="w-[600px] h-[240px] mx-auto relative">
              <Image
                src={LogoOticasQueiroz}
                alt="Óticas Queiroz Logo"
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de login */}
      <div className="flex-1 w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-md bg-primary/5 border border-primary/10">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-[var(--primary-blue)]">Login</h2>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Entre com suas credenciais para acessar o sistema
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6" role="alert">
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
                  placeholder="seu@email.com ou CPF."
                  {...register("login")}
                  className={errors.login ? "border-destructive" : "border border-primary/10"}
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
                  className={errors.password ? "border-destructive" : "border border-primary/10"}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--primary-blue)] hover:bg-primary text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 data-testid="loading-spinner" className="mr-2 h-4 w-4 animate-spin" />
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
              href="/auth/forgot-password"
              className="text-sm text-[var(--primary-blue)] hover:underline hover:text-primary text-center w-full"
            >
              Esqueceu sua senha?
            </Link>
          </CardFooter>
        </Card>

        <AppFooterAuth />
      </div>
    </div>
  );
}