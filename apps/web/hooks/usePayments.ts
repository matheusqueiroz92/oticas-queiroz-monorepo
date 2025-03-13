"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  cancelPayment,
  getPaymentsByCashRegister,
} from "@/app/services/paymentService";
import { checkOpenCashRegister } from "@/app/services/cashRegisterService";
import { QUERY_KEYS } from "../app/constants/query-keys";
import type {
  IPayment,
  CreatePaymentDTO,
  PaymentType,
  PaymentStatus,
} from "@/app/types/payment";

interface PaymentFilters {
  search?: string;
  page?: number;
  type?: PaymentType;
  paymentMethod?: string;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}

export function usePayments() {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar pagamentos
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.PAGINATED(currentPage, filters),
    queryFn: () => getAllPayments({ ...filters, page: currentPage }),
    placeholderData: (prevData) => prevData,
  });

  // Dados normalizados
  const payments = data?.payments || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalPayments = data?.pagination?.total || 0;

  // Mutation para criar pagamento
  const createPaymentMutation = useMutation({
    mutationFn: async (data: CreatePaymentDTO) => {
      // Verificar se há um caixa aberto e obter seu ID
      const cashRegisterResult = await checkOpenCashRegister();

      if (!cashRegisterResult.isOpen || !cashRegisterResult.data) {
        throw new Error(
          "É necessário abrir um caixa antes de registrar pagamentos."
        );
      }

      // Adicionar o ID do caixa aos dados do pagamento
      return createPayment({
        ...data,
        cashRegisterId: cashRegisterResult.data._id,
      });
    },
    onSuccess: (newPayment) => {
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENTS.ALL });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      });

      return newPayment;
    },
    onError: (error: unknown) => {
      console.error("Erro ao criar pagamento:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o pagamento. Verifique as informações e tente novamente.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });

      // Se o erro for relacionado ao caixa fechado, redireciona para abrir um caixa
      if (errorMessage.includes("caixa")) {
        router.push("/cash-register/open");
      }
    },
  });

  // Mutation para cancelar pagamento
  const cancelPaymentMutation = useMutation({
    mutationFn: cancelPayment,
    onSuccess: (result, id) => {
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado com sucesso.",
      });

      // Invalidar queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PAYMENTS.DETAIL(id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PAYMENTS.PAGINATED(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      });

      return result;
    },
    onError: (error: unknown, id) => {
      console.error(`Erro ao cancelar pagamento com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar o pagamento.",
      });
    },
  });

  // Custom query para buscar um pagamento específico
  const fetchPaymentById = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.PAYMENTS.DETAIL(id),
      queryFn: () => getPaymentById(id),
      enabled: !!id,
    });
  };

  // Custom query para buscar pagamentos por caixa
  const fetchPaymentsByCashRegister = (cashRegisterId: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.PAYMENTS.BY_CASH_REGISTER(cashRegisterId),
      queryFn: () => getPaymentsByCashRegister(cashRegisterId),
      enabled: !!cashRegisterId,
    });
  };

  // Função para verificar se há um caixa aberto
  const checkForOpenCashRegisterBeforePayment = async (): Promise<
    string | null
  > => {
    try {
      const result = await checkOpenCashRegister();

      if (result.isOpen && result.data) {
        return result.data._id;
      }

      // Notificar que não há caixa aberto
      toast({
        variant: "destructive",
        title: "Nenhum caixa aberto",
        description:
          "É necessário abrir um caixa antes de registrar pagamentos.",
      });

      return null;
    } catch (error) {
      console.error("Erro ao verificar status do caixa:", error);

      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível verificar o status do caixa.",
      });

      return null;
    }
  };

  // Função para atualizar filtros
  const updateFilters = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Funções que utilizam as mutations
  const handleCreatePayment = (data: CreatePaymentDTO) => {
    return createPaymentMutation.mutateAsync(data);
  };

  const handleCancelPayment = (id: string) => {
    return cancelPaymentMutation.mutateAsync(id);
  };

  // Funções de navegação
  const navigateToPaymentDetails = (id: string) => {
    router.push(`/payments/${id}`);
  };

  const navigateToCreatePayment = () => {
    router.push("/payments/new");
  };

  return {
    // Dados e estado
    payments,
    isLoading,
    error: error ? String(error) : null,
    currentPage,
    totalPages,
    totalPayments,
    filters,

    // Mutações e seus estados
    isCreating: createPaymentMutation.isPending,
    isCancelling: cancelPaymentMutation.isPending,

    // Ações
    setCurrentPage,
    updateFilters,
    fetchPaymentById,
    handleCreatePayment,
    handleCancelPayment,
    fetchPaymentsByCashRegister,
    navigateToPaymentDetails,
    navigateToCreatePayment,
    checkForOpenCashRegisterBeforePayment,
    refetch,
  };
}
