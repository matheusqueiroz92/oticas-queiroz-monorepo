"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { requestPasswordReset } from "../../services/authService";

const forgotPasswordSchema = z.object({
  email: z.string().email("Digite um email válido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      await requestPasswordReset(data.email);

      setSuccess(
        "Enviamos um email com instruções para redefinir sua senha. Verifique sua caixa de entrada."
      );
      reset();
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Ocorreu um erro ao processar sua solicitação. Tente novamente."
        );
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
            <div className="w-[300px] h-[120px] mx-auto relative">
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

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <h2 className="text-2xl font-bold text-center">Recuperar Senha</h2>
            <p className="text-sm text-muted-foreground text-center">
              Digite seu email para receber um link de recuperação
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                <Mail className="h-4 w-4 mr-2" />
                <AlertDescription>{success}</AlertDescription>
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
                  "Enviar link de recuperação"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link
              href="/auth/login"
              className="text-sm text-[#1e3a8a] hover:underline flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o login
            </Link>
          </CardFooter>
        </Card>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Óticas Queiroz. Todos os direitos
            reservados.
          </p>
          <p className="mt-1">
            Desenvolvido por{" "}
            <span className="font-medium">Matheus Queiroz</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
