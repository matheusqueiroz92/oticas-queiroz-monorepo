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
      <div className="page-shell-narrow space-y-6">
        <div className="flex items-center justify-center h-64">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensagem de erro se não tiver permissão (apenas se o usuário foi carregado)
  if (user && !hasPermission) {
    return (
      <div className="page-shell-narrow space-y-6">
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
    <div className="page-shell-narrow space-y-6">
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