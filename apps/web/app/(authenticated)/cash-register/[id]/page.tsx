"use client";

import { useParams, useRouter } from "next/navigation";
import { useCashRegister } from "@/hooks/useCashRegister";
import {
  translatePaymentType,
  translatePaymentMethod,
  getPaymentTypeClass,
} from "@/app/utils/formatters";
import { CashRegisterDetails } from "@/components/CashRegister/CashRegisterDetails";

export default function CashRegisterDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const { 
    useCashRegisterDetails, 
    navigateToCloseRegister 
  } = useCashRegister();

  const { 
    register, 
    summary, 
    payments, 
    isLoading, 
    error 
  } = useCashRegisterDetails(id as string);

  const handleGoBack = () => {
    router.push("/cash-register");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <CashRegisterDetails
      register={register!}
      summary={summary}
      payments={payments}
      isLoading={isLoading}
      error={error}
      onGoBack={handleGoBack}
      onPrint={handlePrint}
      onCloseCashRegister={navigateToCloseRegister}
      translatePaymentType={translatePaymentType}
      translatePaymentMethod={translatePaymentMethod}
      getPaymentTypeClass={getPaymentTypeClass}
    />
  );
}