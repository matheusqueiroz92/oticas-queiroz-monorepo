"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useCashRegister } from "@/hooks/cash-register/useCashRegister";
import { CashRegisterCloseForm } from "@/components/cash-register/CashRegisterCloseForm";
import { CashRegisterInfoCard } from "@/components/cash-register/CashRegisterInfoCard";
import { CashRegisterSummary } from "@/components/cash-register/CashRegisterSummary";
import { createCloseCashRegisterForm } from "@/schemas/cash-register-schema";
import { BackButton } from "@/components/ui/back-button";
import { CloseCashRegisterMessageCard } from "@/components/cash-register/CloseCashRegisterMessageCard";
import { ErrorCashRegisterCard } from "@/components/cash-register/ErrorCashRegisterCard";

export default function CloseCashRegisterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [difference, setDifference] = useState<number | null>(null);
  const [isClosingSuccessful, setIsClosingSuccessful] = useState(false);

  const { toast } = useToast();

  const { navigateToCashRegister } = useCashRegister();
  
  const { 
    register: cashRegister, 
    isLoading, 
    error: cashRegisterError,
    isClosing,
    closeRegister
  } = useCashRegister().useCloseCashRegister(id as string);

  const form = createCloseCashRegisterForm();
  
  const closingBalance = form.watch("closingBalance");
  
  // Efeito para verificar se existe um caixa aberto
  useEffect(() => {
    if (cashRegister && cashRegister.status === "open") {
      form.setValue("closingBalance", cashRegister.currentBalance);
      setDifference(0);
    }
  }, [cashRegister, form]);
  
  // Efeito para calcular a diferença entre o saldo de fechamento e o saldo atual
  useEffect(() => {
    if (cashRegister && typeof closingBalance === "number") {
      setDifference(closingBalance - cashRegister.currentBalance);
    }
  }, [closingBalance, cashRegister]);

  // Efeito para redirecionar após fechamento bem-sucedido do caixa
  useEffect(() => {
    if (isClosingSuccessful) {
      const timer = setTimeout(() => {
        router.push("/cash-register");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isClosingSuccessful, router]);

  // Função para lidar com o envio do formulário
  const onSubmit = () => {
    if (!cashRegister || cashRegister.status !== "open") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Este caixa não pode ser fechado ou não existe.",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  // Função para lidar com o fechamento do caixa
  const confirmClose = async () => {
    if (!cashRegister || !id) return;

    const data = form.getValues();

    try {
      // Executa o fechamento do caixa
      await closeRegister({
        closingBalance: data.closingBalance,
        observations: data.observations,
      });
      
      // Fechar o dialog de confirmação
      setShowConfirmDialog(false);
      
      // Mostrar toast de sucesso
      toast({
        title: "Caixa fechado",
        description: "O caixa foi fechado com sucesso.",
      });
      
      // Marcar como fechamento bem-sucedido para acionar o redirecionamento
      setIsClosingSuccessful(true);
      
    } catch (error) {
      // Em caso de erro, o toast já será exibido pelo mutation
      console.error("Erro ao fechar caixa:", error);
      setShowConfirmDialog(false);
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fechar o caixa. Tente novamente.",
      });
    }
  };

  // Se está redirecionando após fechamento bem-sucedido, mostrar loading
  if (isClosingSuccessful) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  {/* Mensagem de erro */}
  if (cashRegisterError) {
    const errorMessage =
      cashRegisterError instanceof Error
        ? cashRegisterError.message
        : "Erro desconhecido ao carregar os dados do caixa";

    return (
      <div className="max-w-3xl mx-auto p-4">
        <ErrorCashRegisterCard
          errorMessage={errorMessage}
          navigateToCashRegister={navigateToCashRegister}
        />
      </div>
    );
  }

  {/* Mensagem de caixa já fechado */}
  if (cashRegister && cashRegister.status !== "open") {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <CloseCashRegisterMessageCard />
      </div>
    );
  }

  {/* Loading */}
  if (isLoading || !cashRegister) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
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
        <h1 className="text-2xl font-bold">Fechar Caixa</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CashRegisterInfoCard register={cashRegister} />
        <CashRegisterSummary register={cashRegister} />
      </div>

      <CashRegisterCloseForm
        form={form}
        cashRegister={cashRegister}
        isSubmitting={isClosing}
        difference={difference}
        showConfirmDialog={showConfirmDialog}
        setShowConfirmDialog={setShowConfirmDialog}
        onSubmit={onSubmit}
        onConfirmClose={confirmClose}
        onCancel={navigateToCashRegister}
      />
    </div>
  );
}