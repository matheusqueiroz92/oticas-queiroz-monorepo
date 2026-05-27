import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, Package, Eye, Star } from "lucide-react";
import { formatCurrency, formatDate } from "@/app/_utils/customer-details-utils";

interface CustomerDetailsStatsSectionProps {
  totalSpent: number;
  currentMonthSpent: number;
  totalOrders: number;
  currentMonthOrders: number;
  totalGlasses: number;
  lastDeliveryDate: string | null;
  deliveredOrdersCount: number;
  loyaltyPoints: number;
}

export function CustomerDetailsStatsSection({
  totalSpent,
  currentMonthSpent,
  totalOrders,
  currentMonthOrders,
  totalGlasses,
  lastDeliveryDate,
  deliveredOrdersCount,
  loyaltyPoints,
}: CustomerDetailsStatsSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        title="Total Gasto"
        value={formatCurrency(totalSpent)}
        icon={DollarSign}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900/30"
        description={
          <span className="text-green-600 dark:text-green-400">
            +{formatCurrency(currentMonthSpent)} este mês
          </span>
        }
      />

      <StatCard
        title="Pedidos"
        value={totalOrders}
        icon={Package}
        iconColor="text-[var(--primary-blue)] dark:text-blue-400"
        bgColor="bg-[var(--primary-blue)]/10 dark:bg-blue-900/30"
        description={
          <span className="text-[var(--primary-blue)] dark:text-blue-400">
            +{currentMonthOrders} este mês
          </span>
        }
      />

      <StatCard
        title="Óculos"
        value={totalGlasses}
        icon={Eye}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-900/30"
        description={
          <span className="text-purple-600 dark:text-purple-400">
            {deliveredOrdersCount > 0 && lastDeliveryDate
              ? `Último: ${formatDate(lastDeliveryDate)}`
              : "Nenhum entregue"}
          </span>
        }
      />

      <StatCard
        title="Fidelidade"
        value={loyaltyPoints.toLocaleString()}
        icon={Star}
        iconColor="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-100 dark:bg-amber-900/30"
        description={
          <span className="text-amber-600 dark:text-amber-400">Pontos acumulados</span>
        }
      />
    </div>
  );
}
