"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/orders/useOrders";
import { usePayments } from "@/hooks/payments/usePayments";
import { useCashRegister } from "@/hooks/cash-register/useCashRegister";
import { useSearchLegacyClient } from "@/hooks/legacy-clients/useSearchLegacyClient";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { 
  getTodayPayments, 
  getWeeklyCustomersCount, 
  getRecentOrders, 
  getSalesTotal, 
  getOrdersCountByStatus,
  getYesterdayPayments,
  getSalesGrowthPercentage,
  getTodayOrdersCount,
  getCashOpenTime
} from "@/app/_utils/dashboard-utils";
import type { IPayment } from "@/app/_types/payment";

interface DialogStates {
  orderDialogOpen: boolean;
  customerDialogOpen: boolean;
  productDialogOpen: boolean;
  paymentDialogOpen: boolean;
}

export function useDashboard() {
  const { user } = useAuth();

  const userName = user?.name || "";
  const userRole = user?.role || "";
  const userId = user?._id || "";

  // Estados dos diálogos
  const [dialogStates, setDialogStates] = useState<DialogStates>({
    orderDialogOpen: false,
    customerDialogOpen: false,
    productDialogOpen: false,
    paymentDialogOpen: false,
  });

  const isCustomer = userRole === "customer";

  // Hooks de dados
  const { 
    isLoading: isLoadingOrders,
    orders: allOrders,
    getClientName,
  } = useOrders();

  const { totalItems: totalCustomers, customers } = useCustomers();
  
  const { isLoading: isLoadingPayments, payments: allPayments } = usePayments(false);
  
  const { isLoading: isLoadingCashRegister, currentCashRegister } = useCashRegister(false);
  
  // Buscar cliente legado por CPF/CNPJ do usuário logado
  const userCpf = user?.cpf || "";
  const {
    data: legacyClient,
    isLoading: isLoadingLegacyClient
  } = useSearchLegacyClient(isCustomer && userCpf ? userCpf : undefined);

  // Cálculos memoizados para performance
  const dashboardData = useMemo(() => {
    const todayPayments = allPayments ? getTodayPayments(allPayments as IPayment[]) : [];
    const yesterdayPayments = allPayments ? getYesterdayPayments(allPayments as IPayment[]) : [];
    const weeklyCustomersCount = getWeeklyCustomersCount(customers);
    const recentOrders = getRecentOrders(allOrders);
    const salesTotal = getSalesTotal(todayPayments);
    const pendingOrdersCount = getOrdersCountByStatus(allOrders, ["pending"]);
    const salesGrowthPercentage = getSalesGrowthPercentage(todayPayments, yesterdayPayments);
    const todayOrdersCount = getTodayOrdersCount(allOrders);
    const cashOpenTime = getCashOpenTime(currentCashRegister);

    return {
      todayPayments,
      yesterdayPayments,
      weeklyCustomersCount,
      recentOrders,
      salesTotal,
      pendingOrdersCount,
      salesGrowthPercentage,
      todayOrdersCount,
      cashOpenTime,
      totalOrders: allOrders?.length || 0,
    };
  }, [allPayments, customers, allOrders, currentCashRegister]);

  // Funções para controlar diálogos
  const openDialog = (dialogName: keyof DialogStates) => {
    setDialogStates(prev => ({ ...prev, [dialogName]: true }));
  };

  const closeDialog = (dialogName: keyof DialogStates) => {
    setDialogStates(prev => ({ ...prev, [dialogName]: false }));
  };

  const toggleDialog = (dialogName: keyof DialogStates) => {
    setDialogStates(prev => ({ ...prev, [dialogName]: !prev[dialogName] }));
  };

  return {
    // Dados do usuário
    userName,
    userRole,
    userId,
    isCustomer,

    // Estados de loading
    isLoadingOrders,
    isLoadingPayments,
    isLoadingCashRegister,
    isLoadingLegacyClient,

    // Dados calculados
    dashboardData,
    totalCustomers,
    currentCashRegister,
    legacyClient,
    getClientName,

    // Dados brutos para componentes específicos
    allPayments: allPayments as IPayment[],

    // Estados dos diálogos
    dialogStates,
    openDialog,
    closeDialog,
    toggleDialog,
  };
} 