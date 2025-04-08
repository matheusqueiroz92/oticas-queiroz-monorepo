"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import {
  getCashRegisterById,
  getCashRegisterSummary,
} from "@/app/services/cashRegisterService";
import { getPaymentsByCashRegister } from "@/app/services/paymentService";
import { useCashRegister } from "../../../../hooks/useCashRegister";
import {
  translatePaymentType,
  translatePaymentMethod,
  getPaymentTypeClass,
} from "@/app/utils/formatters";
import { CashRegisterDetails } from "@/components/CashRegister/CashRegisterDetails";
import type { IPayment } from "@/app/types/payment";

export default function CashRegisterDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payments, setPayments] = useState<IPayment[]>([]);

  const { navigateToCloseRegister } = useCashRegister();

  const {
    data: currentRegister,
    isLoading: isLoadingRegister,
    error: registerError,
  } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.DETAIL(id as string),
    queryFn: () => getCashRegisterById(id as string),
    enabled: !!id,
  });

  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.SUMMARY(id as string),
    queryFn: () => getCashRegisterSummary(id as string),
    enabled: !!id,
  });

  const {
    data: paymentsData,
    isLoading: isLoadingPayments,
    error: paymentsError,
  } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.BY_CASH_REGISTER(id as string),
    queryFn: () => getPaymentsByCashRegister(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (paymentsData) {
      setPayments(paymentsData || []);
    }
  }, [paymentsData]);

  const isLoading = isLoadingRegister || isLoadingSummary || isLoadingPayments;
  const error = registerError || summaryError || paymentsError;

  const handleGoBack = () => {
    router.push("/cash-register");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <CashRegisterDetails
      register={currentRegister!}
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