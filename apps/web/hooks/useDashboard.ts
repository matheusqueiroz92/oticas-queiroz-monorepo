"use client";

import { useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import { useOrders } from "@/hooks/useOrders";
import { usePayments } from "@/hooks/usePayments";
import { useCashRegister } from "@/hooks/useCashRegister";
import { useLegacyClients } from "@/hooks/useLegacyClients";
import { useCustomers } from "@/hooks/useCustomers";
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
  // Estados do usuário
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");

  // Estados dos diálogos
  const [dialogStates, setDialogStates] = useState<DialogStates>({
    orderDialogOpen: false,
    customerDialogOpen: false,
    productDialogOpen: false,
    paymentDialogOpen: false,
  });

  // Inicializar dados do usuário
  useEffect(() => {
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";
    const id = Cookies.get("userId") || "";

    setUserName(name);
    setUserRole(role);
    setUserId(id);
  }, []);

  const isCustomer = userRole === "customer";

  // Hooks de dados
  const { 
    isLoading: isLoadingOrders,
    orders: allOrders,
    getClientName,
  } = useOrders();

  const { totalItems: totalCustomers, customers } = useCustomers();
  
  const { isLoading: isLoadingPayments, payments: allPayments } = usePayments();
  
  const { isLoading: isLoadingCashRegister, currentCashRegister } = useCashRegister();
  
  const { useSearchLegacyClient } = useLegacyClients();
  
  const {
    data: legacyClient,
    isLoading: isLoadingLegacyClient
  } = useSearchLegacyClient(isCustomer ? userId : undefined);

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