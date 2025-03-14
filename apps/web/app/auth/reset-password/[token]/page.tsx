"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LogoOticasQueiroz from "../../../../public/logo-oticas-queiroz-branca.png";
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
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import {
  resetPassword,
  validateResetToken,
} from "../../../services/authService";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<any>;
}) {
  const router = useRouter();
  const resolvedParams =
    typeof params === "object" && !("then" in params) ? params : use(params);

  const { token } = resolvedParams;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const validateToken = async () => {
      try {
        setIsValidating(true);

        if (!token || token.length < 10) {
          console.error("Token inválido ou muito curto:", token);
          setIsTokenValid(false);
          setError("O token fornecido é inválido");
          return;
        }

        const isValid = await validateResetToken(token);
        setIsTokenValid(isValid);

        if (!isValid) {
          setError("O token fornecido é inválido ou expirou");
        }
      } catch (error) {
        console.error("Erro ao validar token:", error);
        setIsTokenValid(false);
        setError("Não foi possível validar o token");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      await resetPassword(token, data.password);

      setSuccess("Senha redefinida com sucesso!");

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Ocorreu um erro ao redefinir sua senha. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar estados diferentes baseados na validação do token
  const renderContent = () => {
    // Estado de carregamento
    if (isValidating) {
      return (
        <div className="flex flex-col items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-[#2f67ff] mb-4" />
          <p className="text-center">Verificando seu link de redefinição...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Token: {token.substring(0, 6)}...{token.substring(token.length - 6)}
          </p>
        </div>
      );
    }

    // Token inválido
    if (!isTokenValid) {
      return (
        <div className="flex flex-col items-center justify-center p-6">
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Link inválido ou expirado
          </h3>
          <p className="text-center text-muted-foreground mb-3">
            O link para redefinição de senha é inválido ou já expirou. Por
            favor, solicite um novo link.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4 mt-2 text-sm">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-muted-foreground mb-4">
            Token: {token.substring(0, 6)}...{token.substring(token.length - 6)}
          </p>

          <Button
            asChild
            className="bg-[#2f67ff] hover:bg-[#1e40af] text-white"
          >
            <Link href="/auth/forgot-password">Solicitar novo link</Link>
          </Button>
        </div>
      );
    }

    if (success) {
      return (
        <div className="flex flex-col items-center justify-center p-6">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Senha redefinida!</h3>
          <p className="text-center text-muted-foreground mb-6">
            Sua senha foi redefinida com sucesso. Você será redirecionado para a
            página de login.
          </p>
          <Button
            asChild
            className="bg-[#2f67ff] hover:bg-[#1e40af] text-white"
          >
            <Link href="/auth/login">Ir para o login</Link>
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Nova Senha
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

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirmar Senha
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            className={errors.confirmPassword ? "border-destructive" : ""}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
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
            "Redefinir Senha"
          )}
        </Button>
      </form>
    );
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
            <h2 className="text-2xl font-bold text-center">Redefinir Senha</h2>
            <p className="text-sm text-muted-foreground text-center">
              Crie uma nova senha para sua conta
            </p>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
          {!success && !isValidating && isTokenValid && (
            <CardFooter className="flex justify-center">
              <Link
                href="/auth/login"
                className="text-sm text-[#1e3a8a] hover:underline flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o login
              </Link>
            </CardFooter>
          )}
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
