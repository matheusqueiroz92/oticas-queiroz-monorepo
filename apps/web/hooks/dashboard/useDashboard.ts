"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/orders/useOrders";
import { usePayments } from "@/hooks/payments/usePayments";
import { useCashRegister } from "@/hooks/cash-register/useCashRegister";
import { useSearchLegacyClient } from "@/hooks/legacy-clients/useSearchLegacyClient";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { getDashboardDailySales } from "@/app/_services/paymentService";
import { getDashboardDailyOrdersCount } from "@/app/_services/orderService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { formatLocalDateParam, getYesterdayDate } from "@/app/_utils/date-utils";
import {
  getWeeklyCustomersCount,
  getRecentOrders,
  getSalesGrowthFromTotals,
  getOrdersGrowthFromCounts,
  getCashOpenTime,
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

  const [dialogStates, setDialogStates] = useState<DialogStates>({
    orderDialogOpen: false,
    customerDialogOpen: false,
    productDialogOpen: false,
    paymentDialogOpen: false,
  });

  const isCustomer = userRole === "customer";

  const todayDate = useMemo(() => new Date(), []);
  const yesterdayDate = useMemo(() => getYesterdayDate(), []);

  const todayDateParam = formatLocalDateParam(todayDate);
  const yesterdayDateParam = formatLocalDateParam(yesterdayDate);

  const {
    isLoading: isLoadingOrders,
    orders: allOrders,
    getClientName,
  } = useOrders();

  const { customers } = useCustomers();

  const { isLoading: isLoadingPayments, payments: allPayments } = usePayments(false);

  const { isLoading: isLoadingCashRegister, currentCashRegister } = useCashRegister();

  const { data: todaySales, isLoading: isLoadingTodaySales } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.DASHBOARD_SALES(todayDateParam),
    queryFn: () => getDashboardDailySales(todayDate),
    refetchOnWindowFocus: true,
  });

  const { data: yesterdaySales, isLoading: isLoadingYesterdaySales } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.DASHBOARD_SALES(yesterdayDateParam),
    queryFn: () => getDashboardDailySales(yesterdayDate),
    refetchOnWindowFocus: true,
  });

  const { data: todayOrders, isLoading: isLoadingTodayOrders } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.DASHBOARD_DAILY(todayDateParam),
    queryFn: () => getDashboardDailyOrdersCount(todayDate),
    refetchOnWindowFocus: true,
  });

  const { data: yesterdayOrders, isLoading: isLoadingYesterdayOrders } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.DASHBOARD_DAILY(yesterdayDateParam),
    queryFn: () => getDashboardDailyOrdersCount(yesterdayDate),
    refetchOnWindowFocus: true,
  });

  const isLoadingSalesStats = isLoadingTodaySales || isLoadingYesterdaySales;
  const isLoadingOrdersStats = isLoadingTodayOrders || isLoadingYesterdayOrders;

  const userCpf = user?.cpf || "";
  const {
    data: legacyClient,
    isLoading: isLoadingLegacyClient,
  } = useSearchLegacyClient(isCustomer && userCpf ? userCpf : undefined);

  const salesTotal = todaySales?.totalSales ?? 0;
  const salesGrowthPercentage = getSalesGrowthFromTotals(
    todaySales?.totalSales ?? 0,
    yesterdaySales?.totalSales ?? 0
  );

  const todayOrdersCount = todayOrders?.count ?? 0;
  const ordersGrowthPercentage = getOrdersGrowthFromCounts(
    todayOrders?.count ?? 0,
    yesterdayOrders?.count ?? 0
  );

  const dashboardData = useMemo(() => {
    const weeklyCustomersCount = getWeeklyCustomersCount(customers);
    const recentOrders = getRecentOrders(allOrders);
    const cashOpenTime = getCashOpenTime(currentCashRegister);

    return {
      weeklyCustomersCount,
      recentOrders,
      salesTotal,
      salesGrowthPercentage,
      todayOrdersCount,
      ordersGrowthPercentage,
      cashOpenTime,
    };
  }, [
    allOrders,
    customers,
    currentCashRegister,
    salesTotal,
    salesGrowthPercentage,
    todayOrdersCount,
    ordersGrowthPercentage,
  ]);

  const openDialog = (dialogName: keyof DialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialogName]: true }));
  };

  const closeDialog = (dialogName: keyof DialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialogName]: false }));
  };

  const toggleDialog = (dialogName: keyof DialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialogName]: !prev[dialogName] }));
  };

  return {
    userName,
    userRole,
    userId,
    isCustomer,
    isLoadingOrders,
    isLoadingPayments,
    isLoadingSalesStats,
    isLoadingOrdersStats,
    isLoadingCashRegister,
    isLoadingLegacyClient,
    dashboardData,
    currentCashRegister,
    legacyClient,
    getClientName,
    allPayments: allPayments as IPayment[],
    dialogStates,
    openDialog,
    closeDialog,
    toggleDialog,
  };
}
