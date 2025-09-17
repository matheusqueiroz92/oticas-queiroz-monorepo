"use client";

import { useCashRegister } from "@/hooks/cash-register/useCashRegister";
import { CashRegisterOpenForm } from "@/components/cash-register/CashRegisterOpenForm";
import { 
  createOpenCashRegisterForm, 
  type OpenCashRegisterFormValues 
} from "@/schemas/cash-register-schema";
import { BackButton } from "@/components/ui/back-button";

export default function OpenCashRegisterPage() {
  const { navigateToCashRegister } = useCashRegister();

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
    }).catch(() => {
      if (hasCashRegisterOpen) {
        form.setError("openingBalance", {
          type: "manual",
          message: "Já existe um caixa aberto. Feche-o antes de abrir um novo.",
        });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <BackButton
          onClick={navigateToCashRegister}
          label="Voltar"        
        />
        <h1 className="text-2xl font-bold">Abrir Caixa</h1>
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