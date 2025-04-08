"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import { useToast } from "@/hooks/useToast";
import { useCashRegister } from "../../../../hooks/useCashRegister";
import { checkOpenCashRegister } from "@/app/services/cashRegisterService";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { CashRegisterOpenForm } from "@/components/CashRegister/CashRegisterOpenForm";
import { 
  createOpenCashRegisterForm, 
  type OpenCashRegisterFormValues 
} from "@/schemas/cash-register-schema";

export default function OpenCashRegisterPage() {
  const router = useRouter();
  const [hasCashRegisterOpen, setHasCashRegisterOpen] = useState(false);
  const { toast } = useToast();
  const { handleOpenCashRegister } = useCashRegister();

  const form = createOpenCashRegisterForm();

  const {
    data: cashRegisterData,
    isLoading: isChecking,
    error: checkError,
  } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
    queryFn: checkOpenCashRegister,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (cashRegisterData) {
      if (cashRegisterData.isOpen) {
        setHasCashRegisterOpen(true);

        toast({
          variant: "destructive",
          title: "Caixa já aberto",
          description:
            "Já existe um caixa aberto. Feche-o antes de abrir um novo.",
        });

        form.setError("openingBalance", {
          type: "manual",
          message: "Já existe um caixa aberto. Feche-o antes de abrir um novo.",
        });
      } else {
        setHasCashRegisterOpen(false);
      }
    } else {
      setHasCashRegisterOpen(false);
    }
  }, [cashRegisterData, form, toast]);

  const openCashRegisterMutation = useMutation({
    mutationFn: handleOpenCashRegister,
    onSuccess: () => {
      toast({
        title: "Caixa aberto",
        description: "O caixa foi aberto com sucesso.",
      });
      router.push("/cash-register");
    },
    onError: (error) => {
      console.error("Erro ao abrir caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível abrir o caixa. Tente novamente.",
      });
    },
  });

  const onSubmit = async (data: OpenCashRegisterFormValues) => {
    if (hasCashRegisterOpen) {
      toast({
        variant: "destructive",
        title: "Caixa já aberto",
        description:
          "Já existe um caixa aberto. Feche-o antes de abrir um novo.",
      });
      return;
    }

    openCashRegisterMutation.mutate({
      openingBalance: data.openingBalance,
      observations: data.observations,
      openingDate: new Date(),
    });
  };

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
        <h1 className="text-2xl font-bold">Abrir Caixa</h1>
      </div>

      <CashRegisterOpenForm
        form={form}
        isSubmitting={openCashRegisterMutation.isPending}
        onSubmit={onSubmit}
        onCancel={handleCancel}
        hasCashRegisterOpen={hasCashRegisterOpen}
      />
    </div>
  );
}