"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { api } from "@/app/services/auth";
import {
  getAllCashRegisters,
  checkOpenCashRegister,
  openCashRegister,
  closeCashRegister,
  getCashRegisterById,
  getCashRegisterSummary,
} from "@/app/services/cashRegister";
import type {
  ICashRegister,
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
  const [cashRegisters, setCashRegisters] = useState<ICashRegister[]>([]);
  const [activeRegister, setActiveRegister] = useState<ICashRegister | null>(
    null
  );
  const [currentRegister, setCurrentRegister] = useState<ICashRegister | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegisters, setTotalRegisters] = useState(0);
  const [filters, setFilters] = useState<CashRegisterFilters>({});

  const router = useRouter();
  const { toast } = useToast();

  // Função para buscar todos os registros
  const fetchCashRegisters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar parâmetros de busca
      const params = {
        page: currentPage,
        ...filters,
      };

      // Usar a nova rota base
      const { registers, pagination } = await getAllCashRegisters(params);

      setCashRegisters(registers);

      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalRegisters(pagination.total || registers.length);
      } else {
        setTotalPages(1);
        setTotalRegisters(registers.length);
      }

      // Verificar se há um caixa aberto entre os registros
      const openRegister = registers.find(
        (register) => register.status === "open"
      );

      if (openRegister) {
        setActiveRegister(openRegister);
      } else {
        setActiveRegister(null);
      }
    } catch (error) {
      console.error("Erro ao buscar registros de caixa:", error);
      setError("Não foi possível carregar os registros de caixa.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchCashRegisters();
  }, [fetchCashRegisters]);

  // Função para buscar um registro específico
  const fetchCashRegisterById = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/cash-registers/${id}`);
      const register = response.data;
      setCurrentRegister(register);
      return register;
    } catch (error) {
      console.error(`Erro ao buscar caixa com ID ${id}:`, error);
      setError(`Não foi possível carregar os dados do caixa #${id}.`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar o resumo de um registro
  const fetchCashRegisterSummary = async (id: string) => {
    try {
      setLoading(true);
      const summary = await getCashRegisterSummary(id);
      return summary;
    } catch (error) {
      console.error(`Erro ao buscar resumo do caixa com ID ${id}:`, error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir um novo caixa
  const handleOpenCashRegister = async (data: OpenCashRegisterDTO) => {
    try {
      setLoading(true);
      const result = await api.post("/api/cash-registers/open", data);

      setActiveRegister(result.data);

      toast({
        title: "Caixa aberto",
        description: "O caixa foi aberto com sucesso.",
      });

      return result.data;
    } catch (error) {
      console.error("Erro ao abrir caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível abrir o caixa. Verifique as informações e tente novamente.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para fechar um caixa
  const handleCloseCashRegister = async (
    id: string,
    data: CloseCashRegisterDTO
  ) => {
    try {
      setLoading(true);
      const result = await api.post("/api/cash-registers/close", data);

      setActiveRegister(null);

      toast({
        title: "Caixa fechado",
        description: "O caixa foi fechado com sucesso.",
      });

      // Recarregar a lista após o fechamento
      fetchCashRegisters();

      return result.data;
    } catch (error) {
      console.error("Erro ao fechar caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível fechar o caixa. Verifique as informações e tente novamente.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para navegar para detalhes do caixa
  const navigateToRegisterDetails = (id: string) => {
    router.push(`/cash-register/${id}`);
  };

  // Função para navegar para a página de abertura de caixa
  const navigateToOpenRegister = () => {
    router.push("/cash-register/open");
  };

  // Função para navegar para a página de fechamento de caixa
  const navigateToCloseRegister = (id: string) => {
    router.push(`/cash-register/close/${id}`);
  };

  // Função para atualizar filtros
  const updateFilters = (newFilters: CashRegisterFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Função para verificar se há um caixa aberto
  const checkForOpenRegister = async (): Promise<boolean> => {
    try {
      const result = await checkOpenCashRegister();
      return result.isOpen;
    } catch (error) {
      console.error("Erro ao verificar se há caixa aberto:", error);
      return false;
    }
  };

  return {
    cashRegisters,
    activeRegister,
    currentRegister,
    loading,
    error,
    currentPage,
    totalPages,
    totalRegisters,
    filters,
    setCurrentPage,
    updateFilters,
    fetchCashRegisters,
    fetchCashRegisterById,
    fetchCashRegisterSummary,
    handleOpenCashRegister,
    handleCloseCashRegister,
    navigateToRegisterDetails,
    navigateToOpenRegister,
    navigateToCloseRegister,
    checkForOpenRegister,
  };
}
