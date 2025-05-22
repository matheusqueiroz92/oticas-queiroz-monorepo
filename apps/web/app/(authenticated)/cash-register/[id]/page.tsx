"use client";

import { useParams } from "next/navigation";
import { useCashRegister } from "@/hooks/useCashRegister";
import {
  translatePaymentType,
  translatePaymentMethod,
  getPaymentTypeClass,
} from "@/app/_utils/formatters";
import { CashRegisterDetails } from "@/components/CashRegister/CashRegisterDetails";

export default function CashRegisterDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
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