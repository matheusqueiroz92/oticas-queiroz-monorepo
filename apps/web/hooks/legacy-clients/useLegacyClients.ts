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

interface LegacyClientFilters {
  status?: "active" | "inactive" | "all";
  debtRange?: "low" | "medium" | "high" | "all";
  search?: string;
}

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

export function useLegacyClients(options: UseLegacyClientOptions = {}) {
  const router = useRouter();
  const { enableQueries = true } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados
  const [filters, setFilters] = useState<LegacyClientFilters>({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const debouncedSearch = useDebounce(search, 500);

  // Query principal
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.LEGACY_CLIENT.PAGINATED(currentPage, {
      ...filters,
      search: debouncedSearch,
      limit: pageSize,
    }),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", pageSize.toString());

      if (debouncedSearch) {
        queryParams.append("search", debouncedSearch);
      }

      if (filters.status && filters.status !== "all") {
        queryParams.append("status", filters.status);
      }

      if (filters.debtRange && filters.debtRange !== "all") {
        queryParams.append("debtRange", filters.debtRange);
      }

      const response = await api.get(`${API_ROUTES.LEGACY_CLIENTS.LIST}?${queryParams.toString()}`);
      return response.data;
    },
    enabled: enableQueries,
  });

  const clients = data?.clients || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalClients = data?.pagination?.total || 0;

  // Navegação
  const navigateToLegacyClientDetails = useCallback((id: string) => {
    router.push(`/legacy-clients/${id}`);
  }, [router]);

  // Atualização de filtros
  const updateFilters = useCallback((newFilters: LegacyClientFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  // Contagem de filtros ativos
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.status && filters.status !== "all") count++;
    if (filters.debtRange && filters.debtRange !== "all") count++;
    if (debouncedSearch) count++;
    return count;
  }, [filters, debouncedSearch]);

  // Mutations
  const updateLegacyClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LegacyClient> }) =>
      updateLegacyClient(id, data),
    onSuccess: (_, variables) => {
      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEGACY_CLIENT.DETAIL(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["legacyClients"] });
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
      queryClient.invalidateQueries({ queryKey: ["legacyClients"] });
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
      queryClient.invalidateQueries({ queryKey: ["legacyClients"] });
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

  // Handlers
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
    // Dados
    clients,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalPages,
    totalClients,
    
    // Estados
    search,
    setSearch,
    filters,
    updateFilters,
    
    // Ações
    setCurrentPage,
    refetch,
    navigateToLegacyClientDetails,
    handleUpdateLegacyClient,
    handleToggleStatus,
    handleCreateLegacyClient,
    
    // Utilitários
    getActiveFiltersCount,
    
    // Estados de loading
    isUpdating: updateLegacyClientMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isCreating: createLegacyClientMutation.isPending,
  };
}