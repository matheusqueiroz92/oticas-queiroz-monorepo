"use client";

import { useQuery } from "@tanstack/react-query";
import { getPaymentHistory } from "@/app/_services/legacyClientService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";

export function useLegacyClientPaymentHistory(clientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.LEGACY_CLIENT.PAYMENT_HISTORY(clientId),
    queryFn: () => getPaymentHistory(clientId),
    enabled: !!clientId,
  });
} 