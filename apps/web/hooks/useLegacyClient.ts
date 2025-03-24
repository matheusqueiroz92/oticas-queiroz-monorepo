"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { useCallback } from "react";
import {
  getAllLegacyClients,
  getLegacyClientById,
  searchLegacyClientByIdentifier,
  getDebtors,
  getPaymentHistory,
  updateLegacyClient,
  toggleLegacyClientStatus,
  createLegacyClient
} from "@/app/services/legacyClientService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import type { LegacyClient } from "../app/types/legacy-client";

interface UseLegacyClientOptions {
  enableQueries?: boolean;
}

// Adicionando os query keys necessários que podem estar faltando na constante

export function useLegacyClient(options: UseLegacyClientOptions = {}) {
  const { enableQueries = true } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar cliente legado pelo documento (CPF/CNPJ)
  const useSearchLegacyClient = (identifier?: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.LEGACY_CLIENT.SEARCH(identifier || ''),
      queryFn: () => searchLegacyClientByIdentifier(identifier || ''),
      enabled: enableQueries && !!identifier,
    });
  };

  // Buscar cliente legado pelo ID
  const fetchLegacyClientById = (id?: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.LEGACY_CLIENT.DETAIL(id || ''),
      queryFn: () => getLegacyClientById(id || ''),
      enabled: enableQueries && !!id,
    });
  };

  // Buscar todos os clientes com dívidas
  const useDebtors = () => {
    return useQuery({
      queryKey: QUERY_KEYS.LEGACY_CLIENT.DEBTORS,
      queryFn: getDebtors,
      enabled: enableQueries,
    });
  };

  // Buscar histórico de pagamentos de um cliente
  const usePaymentHistory = (clientId?: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.LEGACY_CLIENT.PAYMENT_HISTORY(clientId || ''),
      queryFn: () => getPaymentHistory(clientId || ''),
      enabled: enableQueries && !!clientId,
    });
  };

  // Atualizar um cliente legado
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

  // Alternar status do cliente (ativo/inativo)
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

  // Criar um novo cliente legado
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
    // Queries
    useSearchLegacyClient,
    fetchLegacyClientById,
    useDebtors,
    usePaymentHistory,
    
    // Mutations
    handleUpdateLegacyClient,
    handleToggleStatus,
    handleCreateLegacyClient,
    
    // Status
    isUpdating: updateLegacyClientMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isCreating: createLegacyClientMutation.isPending,
  };
}