"use client";

import { useParams, useRouter } from "next/navigation";
import { useCashRegister } from "@/hooks/cash-register/useCashRegister";
import {
  translatePaymentType,
  translatePaymentMethod,
  getPaymentTypeClass,
} from "@/app/_utils/formatters";
import { CashRegisterDetails } from "@/components/cash-register/CashRegisterDetails";
import { useAuth } from "@/contexts/authContext";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function CashRegisterDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: isLoadingAuth } = useAuth();
  
  const { 
    useCashRegisterDetails, 
    navigateToCashRegister,
    navigateToCloseRegister,
    handlePrint
  } = useCashRegister();

  const { 
    register, 
    summary, 
    payments, 
    isLoading, 
    error 
  } = useCashRegisterDetails(id as string);

  // Verificar se o usuário tem permissão
  const hasPermission = user?.role === "admin" || user?.role === "employee";

  // Redirecionar se não tiver permissão
  useEffect(() => {
    if (!isLoadingAuth && user && !hasPermission) {
      router.push("/dashboard");
    }
  }, [isLoadingAuth, user, hasPermission, router]);

  // Mostrar loading enquanto verifica permissões
  if (isLoadingAuth) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Mostrar mensagem de erro se não tiver permissão
  if (!hasPermission) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para visualizar detalhes do caixa. Esta funcionalidade está disponível apenas para administradores e funcionários.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Se não há ID ou o ID é inválido, redirecionar
  if (!id || id === "undefined" || id === "null") {
    router.push("/cash-register");
    return null;
  }

  // Se há erro e não está carregando, mostrar erro
  if (error && !isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar caixa</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os detalhes do caixa. O caixa pode não existir ou você não tem permissão para visualizá-lo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Se não há registro e não está carregando, redirecionar
  if (!register && !isLoading) {
    router.push("/cash-register");
    return null;
  }

  return (
    <CashRegisterDetails
      register={register!}
      summary={summary}
      payments={payments}
      isLoading={isLoading}
      error={error}
      onGoBack={navigateToCashRegister}
      onPrint={handlePrint}
      onCloseCashRegister={navigateToCloseRegister}
      translatePaymentType={translatePaymentType}
      translatePaymentMethod={translatePaymentMethod}
      getPaymentTypeClass={getPaymentTypeClass}
    />
  );
}