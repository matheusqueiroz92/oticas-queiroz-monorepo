"use client";

import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/app/_utils/formatters";
import {
  DollarSign,
  ShoppingBag,
  Users,
  HandCoins,
  TrendingUp,
} from "lucide-react";

interface DashboardStatsProps {
  salesTotal: number;
  totalOrders: number;
  pendingOrdersCount: number;
  totalCustomers: number;
  weeklyCustomersCount: number;
  currentBalance: number;
  salesGrowthPercentage: number;
  todayOrdersCount: number;
  cashOpenTime: string;
  isLoadingPayments: boolean;
  isLoadingOrders: boolean;
  isLoadingCashRegister: boolean;
}

export function DashboardStats({
  salesTotal,
  totalOrders,
  totalCustomers,
  weeklyCustomersCount,
  currentBalance,
  salesGrowthPercentage,
  todayOrdersCount,
  cashOpenTime,
  isLoadingPayments,
  isLoadingOrders,
  isLoadingCashRegister,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Vendas Hoje"
        value={formatCurrency(salesTotal)}
        icon={DollarSign}
        iconColor="text-green-600"
        bgColor="bg-green-100 dark:bg-green-100/10"
        isLoading={isLoadingPayments}
        description={
          <>
            <TrendingUp className={`h-4 w-4 inline mr-1 ${salesGrowthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            {salesGrowthPercentage >= 0 ? '+' : ''}{salesGrowthPercentage}% vs ontem
          </>
        }
      />

      <StatCard
        title="Pedidos"
        value={totalOrders}
        icon={ShoppingBag}
        iconColor="text-orange-600"
        bgColor="bg-orange-100 dark:bg-orange-100/10"
        isLoading={isLoadingOrders}
        skeletonWidth="w-16"
        description={
          <>
            <span className="text-orange-600 font-semibold">
              +{todayOrdersCount}
            </span>{" "}
            hoje
          </>
        }
      />

      <StatCard
        title="Total de Clientes"
        value={totalCustomers}
        icon={Users}
        iconColor="text-yellow-600"
        bgColor="bg-yellow-100 dark:bg-yellow-100/10"
        description={
          <>
            <span className="text-yellow-600 font-semibold">+{weeklyCustomersCount}</span> esta semana
          </>
        }
      />

      <StatCard
        title="Caixa Atual"
        value={formatCurrency(currentBalance)}
        icon={HandCoins}
        iconColor="text-violet-600"
        bgColor="bg-violet-100 dark:bg-violet-100/10"
        isLoading={isLoadingCashRegister}
        description={
          <>
            Aberto às <span className="text-purple-600 font-semibold">{cashOpenTime}</span>
          </>
        }
      />
    </div>
  );
} 