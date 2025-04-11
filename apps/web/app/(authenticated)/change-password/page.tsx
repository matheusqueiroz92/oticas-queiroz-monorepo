"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { changePasswordForm, ChangePasswordFormValues } from "@/schemas/change-password-schema";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { handleChangePassword, isChangingPassword } = useProfile();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = changePasswordForm();

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      setError(null);
      setSuccess(null);

      await handleChangePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setSuccess("Senha alterada com sucesso!");
      form.reset();
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao alterar a senha. Tente novamente.";
      setError(errorMessage);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/profile")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Alterar Senha</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <KeyRound className="h-5 w-5 mr-2" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso ao sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
              <ShieldCheck className="h-4 w-4 mr-2" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              id="changePasswordForm"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual*</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha*</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A senha deve ter pelo menos 6 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha*</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/profile")}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="changePasswordForm"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Alterar Senha"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
