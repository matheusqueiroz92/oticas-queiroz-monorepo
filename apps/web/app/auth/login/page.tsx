"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";
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
import { login } from "../../services/auth";

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      console.log("Tentando login com:", data);
      const response = await login(data.email, data.password);
      console.log("Resposta do login:", response);
      return response;
    },
    onSuccess: (data) => {
      Cookies.set("token", data.token, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      Cookies.set("role", data.user.role, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      setError(error.message || "Erro ao fazer login. Tente novamente.");
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      console.error("Erro durante o login:", error);
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
                src="/logo-oticas-queiroz.png"
                alt="Óticas Queiroz Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
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
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
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
                {isSubmitting ? "Entrando..." : "Entrar"}
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
