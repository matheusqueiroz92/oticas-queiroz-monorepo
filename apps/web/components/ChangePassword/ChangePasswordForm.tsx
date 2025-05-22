import { useState } from "react";
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
import { Loader2, KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
import { changePasswordForm, ChangePasswordFormValues } from "@/schemas/change-password-schema";

interface ChangePasswordFormProps {
  onSubmit: (data: ChangePasswordFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function ChangePasswordForm({ onSubmit, onCancel, isLoading }: ChangePasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = changePasswordForm();

  const handleSubmit = async (data: ChangePasswordFormValues) => {
    try {
      setError(null);
      setSuccess(null);

      await onSubmit(data);

      setSuccess("Senha alterada com sucesso!");
      form.reset();
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Ocorreu um erro ao alterar a senha. Tente novamente.";
      setError(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <KeyRound className="h-5 w-5 mr-2 text-primary" />
          Alterar Senha
        </CardTitle>
        <CardDescription>
          Altere sua senha de acesso ao sistema para manter sua conta segura.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            id="changePasswordForm"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Atual *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Digite sua senha atual para confirmar sua identidade
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
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
                  <FormLabel>Confirmar Nova Senha *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Digite novamente a nova senha para confirmação
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="changePasswordForm"
          disabled={isLoading}
        >
          {isLoading ? (
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
  );
}