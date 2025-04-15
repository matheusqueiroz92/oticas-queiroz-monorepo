"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useCashRegister } from "@/hooks/useCashRegister";
import { CashRegisterCloseForm } from "@/components/CashRegister/CashRegisterCloseForm";
import { CashRegisterInfoCard } from "@/components/CashRegister/CashRegisterInfoCard";
import { CashRegisterSummary } from "@/components/CashRegister/CashRegisterSummary";
import { 
  createCloseCashRegisterForm, 
  type CloseCashRegisterFormValues 
} from "@/schemas/cash-register-schema";

export default function CloseCashRegisterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [difference, setDifference] = useState<number | null>(null);

  const { toast } = useToast();
  
  const { 
    register: cashRegister, 
    isLoading, 
    error: cashRegisterError,
    isClosing,
    closeRegister
  } = useCashRegister().useCloseCashRegister(id as string);

  const form = createCloseCashRegisterForm();
  
  useEffect(() => {
    if (cashRegister && cashRegister.status === "open") {
      form.setValue("closingBalance", cashRegister.currentBalance);
      setDifference(0);
    }
  }, [cashRegister, form]);

  const closingBalance = form.watch("closingBalance");

  useEffect(() => {
    if (cashRegister && typeof closingBalance === "number") {
      setDifference(closingBalance - cashRegister.currentBalance);
    }
  }, [closingBalance, cashRegister]);

  const onSubmit = (_data: CloseCashRegisterFormValues) => {
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

  const confirmClose = () => {
    if (!cashRegister || !id) return;

    const data = form.getValues();

    closeRegister({
      closingBalance: data.closingBalance,
      observations: data.observations,
    });
  };

  if (cashRegisterError) {
    const errorMessage =
      cashRegisterError instanceof Error
        ? cashRegisterError.message
        : "Erro desconhecido ao carregar os dados do caixa";

    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Erro</CardTitle>
            <CardDescription className="text-red-700">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/cash-register")}>
              Voltar para Caixas
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (cashRegister && cashRegister.status !== "open") {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Caixa já fechado</CardTitle>
            <CardDescription className="text-yellow-700">
              Este caixa já foi fechado e não pode ser fechado novamente.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/cash-register")}>
              Voltar para Caixas
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading || !cashRegister) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleCancel = () => {
    router.push("/cash-register");
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/cash-register")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
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
        onCancel={handleCancel}
      />
    </div>
  );
}