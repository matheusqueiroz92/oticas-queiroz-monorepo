"use client";

import { useQuery } from "@tanstack/react-query";
import { searchLegacyClientByIdentifier } from "@/app/_services/legacyClientService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";

export function useSearchLegacyClient(identifier?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.LEGACY_CLIENT.SEARCH(identifier || ""),
    queryFn: () => searchLegacyClientByIdentifier(identifier || ""),
    enabled: !!identifier && identifier.length > 0,
  });
} 