"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCashRegister } from "@/hooks/useCashRegister";
import { CashRegisterOpenForm } from "@/components/CashRegister/CashRegisterOpenForm";
import { 
  createOpenCashRegisterForm, 
  type OpenCashRegisterFormValues 
} from "@/schemas/cash-register-schema";

export default function OpenCashRegisterPage() {
  const router = useRouter();
  
  const { 
    hasCashRegisterOpen,
    isOpening,
    openCashRegister,
  } = useCashRegister().useOpenCashRegister();

  const form = createOpenCashRegisterForm();

  const onSubmit = async (data: OpenCashRegisterFormValues) => {
    openCashRegister({
      openingBalance: data.openingBalance,
      observations: data.observations,
      openingDate: new Date(),
    }).catch(_error => {
      if (hasCashRegisterOpen) {
        form.setError("openingBalance", {
          type: "manual",
          message: "Já existe um caixa aberto. Feche-o antes de abrir um novo.",
        });
      }
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
        isSubmitting={isOpening}
        onSubmit={onSubmit}
        onCancel={handleCancel}
        hasCashRegisterOpen={hasCashRegisterOpen}
      />
    </div>
  );
}