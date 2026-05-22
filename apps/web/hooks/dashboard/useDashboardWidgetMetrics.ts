"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrdersCountByStatus } from "@/app/_services/orderService";
import { getDashboardDailySales } from "@/app/_services/paymentService";
import { getAllProducts } from "@/app/_services/productService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { formatLocalDateParam } from "@/app/_utils/date-utils";
import { countLowStockFrames } from "@/app/_utils/product-stock-utils";
import {
  DASHBOARD_WIDGET_METRICS,
  type DashboardWidgetMetricId,
} from "@/app/_types/dashboard-widget";
import { formatCurrency } from "@/app/_utils/formatters";

interface UseDashboardWidgetMetricsOptions {
  metricId: DashboardWidgetMetricId;
  userId: string;
  weeklyCustomersCount: number;
  enabled?: boolean;
}

export function useDashboardWidgetMetrics({
  metricId,
  userId,
  weeklyCustomersCount,
  enabled = true,
}: UseDashboardWidgetMetricsOptions) {
  const todayDate = useMemo(() => new Date(), []);
  const todayDateParam = formatLocalDateParam(todayDate);

  const isOrderStatusMetric =
    metricId === "pending_orders" ||
    metricId === "ready_orders" ||
    metricId === "in_production";

  const orderStatus =
    metricId === "pending_orders"
      ? "pending"
      : metricId === "ready_orders"
        ? "ready"
        : metricId === "in_production"
          ? "in_production"
          : null;

  const { data: orderCount, isLoading: isLoadingOrderCount } = useQuery({
    queryKey: QUERY_KEYS.ORDERS.COUNT_BY_STATUS(orderStatus ?? "none"),
    queryFn: () => getOrdersCountByStatus(orderStatus!),
    enabled: enabled && isOrderStatusMetric && !!orderStatus,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const { data: dailySales, isLoading: isLoadingDailySales } = useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.DASHBOARD_SALES(todayDateParam),
    queryFn: () => getDashboardDailySales(todayDate),
    enabled: enabled && metricId === "debt_payments_today",
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const { data: lowStockCount, isLoading: isLoadingLowStock } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.DASHBOARD_LOW_STOCK,
    queryFn: async () => {
      const { products } = await getAllProducts({
        page: 1,
        limit: 1000,
      });
      return countLowStockFrames(products);
    },
    enabled: enabled && metricId === "low_stock",
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const config = DASHBOARD_WIDGET_METRICS[metricId];

  const { value, isLoading } = useMemo(() => {
    switch (metricId) {
      case "pending_orders":
      case "ready_orders":
      case "in_production":
        return {
          value: orderCount ?? 0,
          isLoading: isLoadingOrderCount,
        };
      case "new_clients_week":
        return {
          value: weeklyCustomersCount,
          isLoading: false,
        };
      case "debt_payments_today":
        return {
          value: formatCurrency(dailySales?.totalDebtPayments ?? 0),
          isLoading: isLoadingDailySales,
        };
      case "low_stock":
        return {
          value: lowStockCount ?? 0,
          isLoading: isLoadingLowStock,
        };
      default:
        return { value: 0, isLoading: false };
    }
  }, [
    metricId,
    orderCount,
    isLoadingOrderCount,
    weeklyCustomersCount,
    dailySales,
    isLoadingDailySales,
    lowStockCount,
    isLoadingLowStock,
  ]);

  return {
    config,
    value,
    isLoading,
    queryKey: QUERY_KEYS.DASHBOARD.WIDGET_METRIC(metricId, userId),
  };
}
