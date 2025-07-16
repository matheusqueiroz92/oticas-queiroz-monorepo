"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { useCallback, useState, useEffect } from "react";
import {
  getAllLegacyClients,
  getLegacyClientById,
  searchLegacyClientByIdentifier,
  getDebtors,
  getPaymentHistory,
  updateLegacyClient,
  toggleLegacyClientStatus,
  createLegacyClient
} from "@/app/_services/legacyClientService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { API_ROUTES } from "@/app/_constants/api-routes";
import { api } from "@/app/_services/authService";
import type { LegacyClient } from "@/app/_types/legacy-client";
import { useRouter } from "next/navigation";

interface UseLegacyClientOptions {
  enableQueries?: boolean;
}

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface LegacyClientsListParams {
  page: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive" | "all";
}

export function useLegacyClients(options: UseLegacyClientOptions = {}) {
  const router = useRouter();
  const { enableQueries = true } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const useLegacyClientsList = (params: LegacyClientsListParams) => {
    const { page, limit = 10, search, status } = params;
    const debouncedSearch = useDebounce(search || "", 500);

    return useQuery({
      queryKey: [QUERY_KEYS.LEGACY_CLIENT.ALL, page, debouncedSearch, status],
      queryFn: async () => {
        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("limit", limit.toString());

        if (debouncedSearch) {
          queryParams.append("search", debouncedSearch);
        }

        if (status && status !== "all") {
          queryParams.append("status", status);
        }

        const response = await api.get(`${API_ROUTES.LEGACY_CLIENTS.LIST}?${queryParams.toString()}`);
        return response.data;
      },
      enabled: enableQueries,
    });
  };

  const useSearchLegacyClient = (identifier?: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.LEGACY_CLIENT.SEARCH(identifier || ''),
      queryFn: () => searchLegacyClientByIdentifier(identifier || ''),
      enabled: enableQueries && !!identifier,
    });
  };

  const fetchLegacyClientById = (id?: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.LEGACY_CLIENT.DETAIL(id || ''),
      queryFn: () => getLegacyClientById(id || ''),
      enabled: enableQueries && !!id,
    });
  };

  const useDebtors = () => {
    return useQuery({
      queryKey: QUERY_KEYS.LEGACY_CLIENT.DEBTORS,
      queryFn: getDebtors,
      enabled: enableQueries,
    });
  };

  const usePaymentHistory = (clientId?: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.LEGACY_CLIENT.PAYMENT_HISTORY(clientId || ''),
      queryFn: () => getPaymentHistory(clientId || ''),
      enabled: enableQueries && !!clientId,
    });
  };

  const updateLegacyClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LegacyClient> }) =>
      updateLegacyClient(id, data),
    onSuccess: (_, variables) => {
      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEGACY_CLIENT.DETAIL(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEGACY_CLIENT.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEGACY_CLIENT.DEBTORS });
    },
    onError: (error) => {
      console.error("Erro ao atualizar cliente:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar os dados do cliente.",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => toggleLegacyClientStatus(id),
    onSuccess: (_, id) => {
      toast({
        title: "Status alterado",
        description: "O status do cliente foi alterado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEGACY_CLIENT.DETAIL(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEGACY_CLIENT.ALL });
    },
    onError: (error) => {
      console.error("Erro ao alterar status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do cliente.",
      });
    },
  });

  const createLegacyClientMutation = useMutation({
    mutationFn: (data: Omit<LegacyClient, "_id">) => createLegacyClient(data),
    onSuccess: () => {
      toast({
        title: "Cliente criado",
        description: "O cliente foi cadastrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEGACY_CLIENT.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEGACY_CLIENT.DEBTORS });
    },
    onError: (error) => {
      console.error("Erro ao criar cliente:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cadastrar o cliente.",
      });
    },
  });

  const navigateToCreateLegacyClient = () => {
    router.push("/legacy-clients/new");
  };

  const handleUpdateLegacyClient = useCallback(
    (id: string, data: Partial<LegacyClient>) => {
      return updateLegacyClientMutation.mutateAsync({ id, data });
    },
    [updateLegacyClientMutation]
  );

  const handleToggleStatus = useCallback(
    (id: string) => {
      return toggleStatusMutation.mutateAsync(id);
    },
    [toggleStatusMutation]
  );

  const handleCreateLegacyClient = useCallback(
    (data: Omit<LegacyClient, "_id">) => {
      return createLegacyClientMutation.mutateAsync(data);
    },
    [createLegacyClientMutation]
  );

  return {
    useDebounce,
    useLegacyClientsList,
    useSearchLegacyClient,
    fetchLegacyClientById,
    useDebtors,
    usePaymentHistory,
    navigateToCreateLegacyClient,
    handleUpdateLegacyClient,
    handleToggleStatus,
    handleCreateLegacyClient,
    isUpdating: updateLegacyClientMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isCreating: createLegacyClientMutation.isPending,
  };
}