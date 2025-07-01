"use client";

import { useMemo } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { IPayment } from "@/app/_types/payment";
import { formatCurrency } from "@/app/_utils/formatters";

interface PaymentsStatisticsProps {
  payments: IPayment[];
  isLoading?: boolean;
}

export function PaymentsStatistics({ payments, isLoading = false }: PaymentsStatisticsProps) {
  const statistics = useMemo(() => {
    if (!payments?.length) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        totalPayments: 0,
        netBalance: 0,
      };
    }

    const sales = payments.filter(p => p.type === 'sale');
    const expenses = payments.filter(p => p.type === 'expense');
    const debtPayments = payments.filter(p => p.type === 'debt_payment');

    const totalRevenue = sales.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, p) => sum + p.amount, 0);
    const totalDebtPayments = debtPayments.reduce((sum, p) => sum + p.amount, 0);
    const netBalance = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      totalPayments: payments.length,
      netBalance,
      totalDebtPayments,
    };
  }, [payments]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Receitas"
        value={formatCurrency(statistics.totalRevenue)}
        icon={TrendingUp}
        iconColor="text-green-600"
        bgColor="bg-green-100 dark:bg-green-100/10"
        isLoading={isLoading}
        description={
          <>
            <span className="text-green-600 font-semibold">
              {payments.filter(p => p.type === 'sale').length}
            </span>{" "}
            vendas registradas
          </>
        }
      />

      <StatCard
        title="Despesas"
        value={formatCurrency(statistics.totalExpenses)}
        icon={TrendingDown}
        iconColor="text-red-600"
        bgColor="bg-red-100 dark:bg-red-100/10"
        isLoading={isLoading}
        description={
          <>
            <span className="text-red-600 font-semibold">
              {payments.filter(p => p.type === 'expense').length}
            </span>{" "}
            despesas registradas
          </>
        }
      />

      <StatCard
        title="Saldo Líquido"
        value={formatCurrency(statistics.netBalance)}
        icon={DollarSign}
        iconColor={statistics.netBalance >= 0 ? "text-green-600" : "text-red-600"}
        bgColor={statistics.netBalance >= 0 ? "bg-green-100 dark:bg-green-100/10" : "bg-red-100 dark:bg-red-100/10"}
        isLoading={isLoading}
        description={
          <>
            {statistics.netBalance >= 0 ? "Lucro" : "Prejuízo"} no período
          </>
        }
      />

      <StatCard
        title="Total de Pagamentos"
        value={statistics.totalPayments}
        icon={CreditCard}
        iconColor="text-blue-600"
        bgColor="bg-blue-100 dark:bg-blue-100/10"
        isLoading={isLoading}
        skeletonWidth="w-16"
        description={
          <>
            Todas as transações registradas
          </>
        }
      />
    </div>
  );
} 