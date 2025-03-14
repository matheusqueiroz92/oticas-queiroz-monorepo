"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import {
  getAllCashRegisters,
  checkOpenCashRegister,
  openCashRegister,
  closeCashRegister,
  getCashRegisterById,
  getCashRegisterSummary,
} from "@/app/services/cashRegisterService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import type {
  OpenCashRegisterDTO,
  CloseCashRegisterDTO,
} from "@/app/types/cash-register";

interface CashRegisterFilters {
  search?: string;
  page?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export function useCashRegister() {
  const [filters, setFilters] = useState<CashRegisterFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar todos os registros de caixa
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.PAGINATED(currentPage, filters),
    queryFn: () => getAllCashRegisters({ ...filters, page: currentPage }),
    placeholderData: (prevData) => prevData, // Substitui keepPreviousData
  });

  // Query para verificar o caixa atual
  const {
    data: currentRegisterData,
    isLoading: isLoadingCurrentRegister,
    refetch: refetchCurrentRegister,
  } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
    queryFn: checkOpenCashRegister,
    refetchOnWindowFocus: true, // Recarregar sempre que a janela ganhar foco
  });

  // Dados normalizados das queries
  const cashRegisters = data?.registers || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalRegisters = data?.pagination?.total || 0;
  const activeRegister =
    currentRegisterData?.isOpen && currentRegisterData?.data
      ? currentRegisterData.data
      : null;

  // Mutation para abrir caixa
  const openCashRegisterMutation = useMutation({
    mutationFn: openCashRegister,
    onSuccess: (result) => {
      toast({
        title: "Caixa aberto",
        description: "O caixa foi aberto com sucesso.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.ALL,
      });

      return result;
    },
    onError: (error) => {
      console.error("Erro ao abrir caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível abrir o caixa. Verifique as informações e tente novamente.",
      });
      throw error;
    },
  });

  // Mutation para fechar caixa
  const closeCashRegisterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloseCashRegisterDTO }) =>
      closeCashRegister(id, data),
    onSuccess: (result) => {
      toast({
        title: "Caixa fechado",
        description: "O caixa foi fechado com sucesso.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.ALL,
      });

      return result;
    },
    onError: (error) => {
      console.error("Erro ao fechar caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível fechar o caixa. Verifique as informações e tente novamente.",
      });
      throw error;
    },
  });

  // Custom query para buscar um caixa específico
  const fetchCashRegisterById = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.DETAIL(id),
      queryFn: () => getCashRegisterById(id),
      enabled: !!id,
    });
  };

  // Custom query para buscar o resumo de um caixa
  const fetchCashRegisterSummary = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.SUMMARY(id),
      queryFn: () => getCashRegisterSummary(id),
      enabled: !!id,
    });
  };

  // Função para atualizar filtros
  const updateFilters = (newFilters: CashRegisterFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Função para verificar se há um caixa aberto
  const checkForOpenRegister = async (): Promise<boolean> => {
    await refetchCurrentRegister();
    return !!activeRegister;
  };

  // Funções que utilizam as mutations
  const handleOpenCashRegister = (data: OpenCashRegisterDTO) => {
    return openCashRegisterMutation.mutateAsync(data);
  };

  const handleCloseCashRegister = (id: string, data: CloseCashRegisterDTO) => {
    return closeCashRegisterMutation.mutateAsync({ id, data });
  };

  // Funções de navegação
  const navigateToRegisterDetails = (id: string) => {
    router.push(`/cash-register/${id}`);
  };

  const navigateToOpenRegister = () => {
    router.push("/cash-register/open");
  };

  const navigateToCloseRegister = (id: string) => {
    router.push(`/cash-register/close/${id}`);
  };

  return {
    // Dados e estado
    cashRegisters,
    activeRegister,
    isLoading: isLoading || isLoadingCurrentRegister,
    error: error ? String(error) : null,
    currentPage,
    totalPages,
    totalRegisters,
    filters,

    // Mutações e seus estados
    isOpening: openCashRegisterMutation.isPending,
    isClosing: closeCashRegisterMutation.isPending,

    // Ações
    setCurrentPage,
    updateFilters,
    fetchCashRegisterById,
    fetchCashRegisterSummary,
    handleOpenCashRegister,
    handleCloseCashRegister,
    navigateToRegisterDetails,
    navigateToOpenRegister,
    navigateToCloseRegister,
    checkForOpenRegister,
    refetch,
  };
}
