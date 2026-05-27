"use client";

import { StatCard } from "@/components/ui/StatCard";
import { DashboardConfigurableStatCard } from "@/components/dashboard/DashboardConfigurableStatCard";
import { formatCurrency } from "@/app/_utils/formatters";
import {
  DollarSign,
  ShoppingBag,
  HandCoins,
  TrendingUp,
} from "lucide-react";

interface DashboardStatsProps {
  userId: string;
  weeklyCustomersCount: number;
  salesTotal: number;
  todayOrdersCount: number;
  ordersGrowthPercentage: number;
  currentBalance: number;
  salesGrowthPercentage: number;
  cashOpenTime: string;
  isCashRegisterOpen: boolean;
  isLoadingSalesStats: boolean;
  isLoadingOrdersStats: boolean;
  isLoadingCashRegister: boolean;
}

export function DashboardStats({
  userId,
  weeklyCustomersCount,
  salesTotal,
  todayOrdersCount,
  ordersGrowthPercentage,
  currentBalance,
  salesGrowthPercentage,
  cashOpenTime,
  isCashRegisterOpen,
  isLoadingSalesStats,
  isLoadingOrdersStats,
  isLoadingCashRegister,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Pedidos Hoje"
        value={todayOrdersCount}
        icon={ShoppingBag}
        iconColor="text-slate-600"
        bgColor="bg-slate-100 dark:bg-slate-100/10"
        isLoading={isLoadingOrdersStats}
        skeletonWidth="w-16"
        description={
          <>
            <TrendingUp
              className={`h-4 w-4 inline mr-1 ${
                ordersGrowthPercentage >= 0 ? "text-green-600" : "text-red-600"
              }`}
            />
            {ordersGrowthPercentage >= 0 ? "+" : ""}
            {ordersGrowthPercentage}% vs ontem
          </>
        }
      />

      <StatCard
        title="Total em Vendas Hoje"
        value={formatCurrency(salesTotal)}
        icon={DollarSign}
        iconColor="text-green-600"
        bgColor="bg-green-100 dark:bg-green-100/10"
        isLoading={isLoadingSalesStats}
        description={
          <>
            <TrendingUp
              className={`h-4 w-4 inline mr-1 ${
                salesGrowthPercentage >= 0 ? "text-green-600" : "text-red-600"
              }`}
            />
            {salesGrowthPercentage >= 0 ? "+" : ""}
            {salesGrowthPercentage}% vs ontem
          </>
        }
      />

      <DashboardConfigurableStatCard
        userId={userId}
        weeklyCustomersCount={weeklyCustomersCount}
      />

      <StatCard
        title="Caixa Atual"
        value={isCashRegisterOpen ? formatCurrency(currentBalance) : "Fechado"}
        icon={HandCoins}
        iconColor={isCashRegisterOpen ? "text-violet-600" : "text-red-600"}
        bgColor={isCashRegisterOpen ? "bg-violet-100 dark:bg-violet-100/10" : "bg-red-100 dark:bg-red-100/10"}
        isLoading={isLoadingCashRegister}
        isCashRegisterOpen={isCashRegisterOpen}
        showOpenCashRegisterButton
        description={
          isCashRegisterOpen ? (
            <>
              Aberto às{" "}
              <span className="text-[var(--primary-blue)] font-semibold">{cashOpenTime}</span>
            </>
          ) : (
            <span className="text-[var(--secondary-red)] font-semibold">Nenhum caixa aberto</span>
          )
        }
      />
    </div>
  );
}
