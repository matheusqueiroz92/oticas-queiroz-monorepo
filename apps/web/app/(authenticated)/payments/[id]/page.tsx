"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPaymentById } from "@/app/services/paymentService";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { usePayments } from "@/hooks/usePayments";
import {
  translatePaymentType,
  translatePaymentMethod,
  translatePaymentStatus,
  getPaymentStatusClass,
} from "@/app/utils/formatters";
import { PaymentDetails } from "@/components/Payments/PaymentDetails";
import type { LegacyClient } from "@/app/types/legacy-client";

export default function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [legacyClient, _setLegacyClient] = useState<LegacyClient | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { handleCancelPayment } = usePayments();

  const {
    data: payment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.DETAIL(id as string),
    queryFn: () => getPaymentById(id as string),
    enabled: !!id,
  });

  const confirmCancelPayment = async () => {
    if (!id) return;

    try {
      await handleCancelPayment(id as string);
      setShowConfirmDialog(false);
      refetch();
    } catch (error) {
      console.error("Erro ao cancelar pagamento:", error);
    }
  };

  const handleGoBack = () => {
    router.push("/payments");
  };
  
  const navigateToOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };
  
  const navigateToCustomer = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };
  
  const navigateToLegacyClient = (legacyClientId: string) => {
    router.push(`/legacy-clients/${legacyClientId}`);
  };
  
  const navigateToCashRegister = (cashRegisterId: string) => {
    router.push(`/cash-register/${cashRegisterId}`);
  };
  
  return (
    <PaymentDetails
      payment={payment ?? null}
      isLoading={isLoading}
      error={error}
      legacyClient={legacyClient}
      showConfirmDialog={showConfirmDialog}
      setShowConfirmDialog={setShowConfirmDialog}
      onCancelPayment={confirmCancelPayment}
      onGoBack={handleGoBack}
      navigateToOrder={navigateToOrder}
      navigateToCustomer={navigateToCustomer}
      navigateToLegacyClient={navigateToLegacyClient}
      navigateToCashRegister={navigateToCashRegister}
      translatePaymentStatus={translatePaymentStatus}
      translatePaymentType={translatePaymentType}
      translatePaymentMethod={translatePaymentMethod}
      getPaymentStatusClass={getPaymentStatusClass}
    />
  );
}