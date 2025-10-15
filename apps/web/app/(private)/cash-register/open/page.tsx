"use client";

import { useCashRegister } from "@/hooks/cash-register/useCashRegister";
import { CashRegisterOpenForm } from "@/components/cash-register/CashRegisterOpenForm";
import { 
  createOpenCashRegisterForm, 
  type OpenCashRegisterFormValues 
} from "@/schemas/cash-register-schema";
import { BackButton } from "@/components/ui/back-button";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Cookies from "js-cookie";

export default function OpenCashRegisterPage() {
  const { navigateToCashRegister } = useCashRegister();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const { 
    hasCashRegisterOpen,
    isOpening,
    openCashRegister,
  } = useCashRegister().useOpenCashRegister();

  const form = createOpenCashRegisterForm();

  // Verificar se o usuário tem permissão
  const hasPermission = user?.role === "admin" || user?.role === "employee";


  // Redirecionar se não tiver permissão
  useEffect(() => {
    if (!isLoading && user && !hasPermission) {
      router.push("/dashboard");
    }
  }, [isLoading, user, hasPermission, router]);

  const onSubmit = async (data: OpenCashRegisterFormValues) => {
    openCashRegister({
      openingBalance: data.openingBalance,
      observations: data.observations,
      openingDate: new Date(),
    }).catch(() => {
      if (hasCashRegisterOpen) {
        form.setError("openingBalance", {
          type: "manual",
          message: "Já existe um caixa aberto. Feche-o antes de abrir um novo.",
        });
      }
    });
  };

  // Mostrar loading enquanto verifica permissões
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-center h-64">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Se o usuário ainda não foi carregado, tentar carregar dos cookies
  if (!user && !isLoading) {
    console.log("Usuário não carregado, verificando cookies...");
    
    // Tentar carregar o usuário dos cookies diretamente
    const role = Cookies.get("role");
    const userId = Cookies.get("userId");
    const name = Cookies.get("name");
    const email = Cookies.get("email");
    const cpf = Cookies.get("cpf");
    
    console.log("Cookies encontrados:", { role, userId, name, email, cpf });
    
    if (role && userId) {
      console.log("Usuário encontrado nos cookies, permitindo acesso temporário");
      // Permitir acesso temporário se o usuário está nos cookies
    } else {
      return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de Autenticação</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>Não foi possível carregar as informações do usuário.</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Cookies encontrados:</p>
                <ul className="text-sm list-disc list-inside">
                  <li>role: {role || "não encontrado"}</li>
                  <li>userId: {userId || "não encontrado"}</li>
                  <li>name: {name || "não encontrado"}</li>
                  <li>email: {email || "não encontrado"}</li>
                  <li>cpf: {cpf || "não encontrado"}</li>
                </ul>
              </div>
              <p className="text-sm">Por favor, faça login novamente.</p>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  // Mostrar mensagem de erro se não tiver permissão (apenas se o usuário foi carregado)
  if (user && !hasPermission) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para abrir o caixa. Esta funcionalidade está disponível apenas para administradores e funcionários.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <BackButton
          onClick={navigateToCashRegister}
          label="Voltar"        
        />
      </div>

      <CashRegisterOpenForm
        form={form}
        isSubmitting={isOpening}
        onSubmit={onSubmit}
        onCancel={navigateToCashRegister}
        hasCashRegisterOpen={hasCashRegisterOpen}
      />
    </div>
  );
}