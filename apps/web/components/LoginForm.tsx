import { Loader2, Link } from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "react-day-picker"
import { Alert, AlertDescription } from "./ui/alert"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"

interface LoginFormProps {
    error: string | null;
    isSubmitting: boolean;
    register: any;
    handleSubmit: any;
    onSubmit: (data: any) => Promise<void>;
    errors: any;
}

export default function LoginForm({ 
    error,
    isSubmitting,
    register,
    handleSubmit,
    onSubmit,
    errors,
}: LoginFormProps) {
    return (
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <h2 className="text-2xl font-bold text-center text-[var(--primary-blue)]">Login</h2>
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
                className="w-full bg-[var(--primary-blue)] hover:bg-primary text-white"
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
              href="/auth/forgot-password"
              className="text-sm text-[#1e3a8a] hover:underline text-center w-full"
            >
              Esqueceu sua senha?
            </Link>
          </CardFooter>
        </Card>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            © 2025 Óticas Queiroz. Todos os direitos
            reservados.
          </p>
          <p className="mt-1">
            Desenvolvido por{" "}
            <span className="font-medium">Matheus Queiroz</span>
          </p>
        </footer>
      </div>
    );
}