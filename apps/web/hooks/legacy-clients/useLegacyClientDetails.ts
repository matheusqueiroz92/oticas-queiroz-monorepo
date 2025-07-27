"use client";

import { useQuery } from "@tanstack/react-query";
import { getLegacyClientById } from "@/app/_services/legacyClientService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";

export function useLegacyClientDetails(clientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.LEGACY_CLIENT.DETAIL(clientId),
    queryFn: () => getLegacyClientById(clientId),
    enabled: !!clientId,
  });
} 