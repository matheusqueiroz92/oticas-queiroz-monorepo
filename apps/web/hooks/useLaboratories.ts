"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import {
  getAllLaboratories,
  getLaboratoryById,
  createLaboratory,
  updateLaboratory,
  toggleLaboratoryStatus,
  deleteLaboratory,
} from "@/app/services/laboratoryService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import type { Laboratory } from "@/app/types/laboratory";

interface LaboratoryFilters {
  search?: string;
  page?: number;
  isActive?: boolean;
}

export function useLaboratories() {
  const [filters, setFilters] = useState<LaboratoryFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar laboratórios
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.LABORATORIES.PAGINATED(currentPage, filters),
    queryFn: () => getAllLaboratories({ ...filters, page: currentPage }),
    placeholderData: (prevData) => prevData,
  });

  // Dados normalizados
  const laboratories = data?.laboratories || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalLaboratories = data?.pagination?.total || 0;

  // Mutation para criar laboratório
  const createLaboratoryMutation = useMutation({
    mutationFn: createLaboratory,
    onSuccess: (newLaboratory) => {
      toast({
        title: "Laboratório criado",
        description: "O laboratório foi criado com sucesso.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LABORATORIES.ALL });

      return newLaboratory;
    },
    onError: (error: unknown) => {
      console.error("Erro ao criar laboratório:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Não foi possível criar o laboratório.",
      });
    },
  });

  // Mutation para atualizar laboratório
  const updateLaboratoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Laboratory> }) =>
      updateLaboratory(id, data),
    onSuccess: (updatedLaboratory) => {
      toast({
        title: "Laboratório atualizado",
        description: "O laboratório foi atualizado com sucesso.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LABORATORIES.DETAIL(updatedLaboratory._id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LABORATORIES.PAGINATED(),
      });

      return updatedLaboratory;
    },
    onError: (error: unknown, variables) => {
      console.error(
        `Erro ao atualizar laboratório com ID ${variables.id}:`,
        error
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o laboratório.",
      });
    },
  });

  // Mutation para alternar status do laboratório
  const toggleLaboratoryStatusMutation = useMutation({
    mutationFn: toggleLaboratoryStatus,
    onSuccess: (updatedLaboratory) => {
      const statusText = updatedLaboratory.isActive ? "ativado" : "desativado";
      toast({
        title: "Status atualizado",
        description: `Laboratório ${statusText} com sucesso.`,
      });

      // Invalidar queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LABORATORIES.DETAIL(updatedLaboratory._id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LABORATORIES.PAGINATED(),
      });

      return updatedLaboratory;
    },
    onError: (error: unknown, id) => {
      console.error(
        `Erro ao alternar status do laboratório com ID ${id}:`,
        error
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do laboratório.",
      });
    },
  });

  // Mutation para deletar laboratório
  const deleteLaboratoryMutation = useMutation({
    mutationFn: deleteLaboratory,
    onSuccess: (_, id) => {
      toast({
        title: "Laboratório excluído",
        description: "O laboratório foi excluído com sucesso.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LABORATORIES.ALL });

      return true;
    },
    onError: (error: unknown, id) => {
      console.error(`Erro ao excluir laboratório com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o laboratório.",
      });
      return false;
    },
  });

  // Custom query para buscar um laboratório específico
  const fetchLaboratoryById = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.LABORATORIES.DETAIL(id),
      queryFn: () => getLaboratoryById(id),
      enabled: !!id,
    });
  };

  // Função para atualizar filtros
  const updateFilters = (newFilters: LaboratoryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Funções que utilizam as mutations
  const handleCreateLaboratory = (data: Omit<Laboratory, "_id">) => {
    return createLaboratoryMutation.mutateAsync(data);
  };

  const handleUpdateLaboratory = (id: string, data: Partial<Laboratory>) => {
    return updateLaboratoryMutation.mutateAsync({ id, data });
  };

  const handleToggleLaboratoryStatus = (id: string) => {
    return toggleLaboratoryStatusMutation.mutateAsync(id);
  };

  const handleDeleteLaboratory = (id: string) => {
    return deleteLaboratoryMutation.mutateAsync(id);
  };

  // Funções de navegação
  const navigateToLaboratoryDetails = (id: string) => {
    router.push(`/laboratories/${id}`);
  };

  const navigateToCreateLaboratory = () => {
    router.push("/laboratories/new");
  };

  const navigateToEditLaboratory = (id: string) => {
    router.push(`/laboratories/${id}/edit`);
  };

  // Formatar endereço completo
  const formatAddress = (address: Laboratory["address"]) => {
    return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""} - ${address.neighborhood}, ${address.city}/${address.state}`;
  };

  return {
    // Dados e estado
    laboratories,
    isLoading,
    error: error ? String(error) : null,
    currentPage,
    totalPages,
    totalLaboratories,
    filters,

    // Mutações e seus estados
    isCreating: createLaboratoryMutation.isPending,
    isUpdating: updateLaboratoryMutation.isPending,
    isTogglingStatus: toggleLaboratoryStatusMutation.isPending,
    isDeleting: deleteLaboratoryMutation.isPending,

    // Ações
    setCurrentPage,
    updateFilters,
    fetchLaboratoryById,
    handleCreateLaboratory,
    handleUpdateLaboratory,
    handleToggleLaboratoryStatus,
    handleDeleteLaboratory,
    navigateToLaboratoryDetails,
    navigateToCreateLaboratory,
    navigateToEditLaboratory,
    formatAddress,
    refetch,
  };
}
