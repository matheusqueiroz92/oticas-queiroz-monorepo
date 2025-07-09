"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyDebts, getMyPayments } from "@/app/_services/paymentService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { useState } from "react";
import type { PaymentType, PaymentStatus } from "@/app/_types/payment";

export interface DebtSummary {
  totalDebt: number;
  paymentHistory: any[];
  orders: any[];
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: PaymentType;
  paymentMethod?: string;
  status?: PaymentStatus;
  search?: string;
}

export function useDebts() {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 10,
  });

  // Query para buscar débitos do cliente
  const {
    data: debtsData,
    isLoading: isLoadingDebts,
    error: debtsError,
    refetch: refetchDebts,
  } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.MY_DEBTS,
    queryFn: getMyDebts,
    staleTime: 0, // Sempre buscar dados atualizados
    gcTime: 0, // Não manter cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Query para buscar pagamentos do cliente
  const {
    data: paymentsData,
    isLoading: isLoadingPayments,
    error: paymentsError,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.MY_PAYMENTS(filters),
    queryFn: () => getMyPayments(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const updateFilters = (newFilters: Partial<PaymentFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
    });
  };

  // Debug console log
  if (debtsData) {
    console.log('🔍 [DEBUG] Hook useDebts - Dados recebidos:', {
      totalDebt: debtsData.totalDebt,
      ordersCount: debtsData.orders?.length || 0,
      paymentHistoryCount: debtsData.paymentHistory?.length || 0,
      orders: debtsData.orders
    });
  }
  
  if (debtsError) {
    console.error('❌ [DEBUG] Hook useDebts - Erro:', debtsError);
  }

  return {
    // Dados dos débitos
    debtsData: debtsData || { totalDebt: 0, paymentHistory: [], orders: [] },
    isLoadingDebts,
    debtsError,
    
    // Dados dos pagamentos
    payments: paymentsData?.payments || [],
    pagination: paymentsData?.pagination,
    isLoadingPayments,
    paymentsError,
    
    // Filtros
    filters,
    updateFilters,
    resetFilters,
    
    // Funções de atualização
    refetchDebts,
    refetchPayments,
    
    // Estados gerais
    isLoading: isLoadingDebts || isLoadingPayments,
    hasError: !!debtsError || !!paymentsError,
  };
} 