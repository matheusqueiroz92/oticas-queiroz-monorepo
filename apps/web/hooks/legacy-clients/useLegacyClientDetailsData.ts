"use client";

import { useLegacyClientDetails } from "./useLegacyClientDetails";
import { useLegacyClientPaymentHistory } from "./useLegacyClientPaymentHistory";

export function useLegacyClientDetailsData(clientId: string) {
  const { 
    data: client, 
    isLoading: isLoadingClient, 
    isError, 
    error,
    refetch: refetchClient
  } = useLegacyClientDetails(clientId);
  
  const { 
    data: paymentHistory, 
    isLoading: isLoadingHistory,
    error: paymentHistoryError
  } = useLegacyClientPaymentHistory(clientId);

  return {
    client,
    paymentHistory,
    isLoading: isLoadingClient || isLoadingHistory,
    isError,
    error,
    paymentHistoryError,
    refetchClient,
  };
} 