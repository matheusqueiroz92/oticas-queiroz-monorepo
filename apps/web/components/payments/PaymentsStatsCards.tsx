import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, Plus, TrendingDown, CreditCard } from "lucide-react";
import { formatCurrency } from "@/app/_utils/formatters";

interface PaymentsStatsCardsProps {
  totalPayments: number;
  paymentsToday: number;
  sales: number;
  expenses: number;
  totalMonth: number;
  salesAmount: number;
  expensesAmount: number;
  netBalance: number;
}

export function PaymentsStatsCards({
  totalPayments,
  paymentsToday,
  sales,
  expenses,
  totalMonth,
}: PaymentsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total de Pagamentos"
        value={totalPayments.toLocaleString()}
        icon={CreditCard}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900"
        description={`+${paymentsToday} hoje`}
      />

      <StatCard
        title="Vendas"
        value={sales}
        icon={Plus}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900"
        description={`${totalPayments > 0 ? ((sales / totalPayments) * 100).toFixed(1) : 0}% do total`}
      />

      <StatCard
        title="Despesas"
        value={expenses}
        icon={TrendingDown}
        iconColor="text-red-600 dark:text-red-400"
        bgColor="bg-red-100 dark:bg-red-900"
        description={`${totalPayments > 0 ? ((expenses / totalPayments) * 100).toFixed(1) : 0}% do total`}
      />

      <StatCard
        title="Valor Total"
        value={formatCurrency(totalMonth)}
        icon={DollarSign}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-900"
        description="Este mês"
      />
    </div>
  );
} 