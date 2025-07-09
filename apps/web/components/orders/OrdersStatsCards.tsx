import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/app/_utils/formatters";
import {
  ShoppingBag,
  Package,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

interface OrdersStatsCardsProps {
  totalOrdersLength: number;
  ordersToday: number;
  ordersInProduction: number;
  ordersReady: number;
  totalOrdersMonth: number;
}

export function OrdersStatsCards({
  totalOrdersLength,
  ordersToday,
  ordersInProduction,
  ordersReady,
  totalOrdersMonth,
}: OrdersStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total de Pedidos"
        value={totalOrdersLength.toLocaleString()}
        icon={ShoppingBag}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900"
        badge={{
          text: `+${ordersToday} hoje`,
          className: "bg-blue-500 text-white border-0"
        }}
      />

      <StatCard
        title="Em Produção"
        value={ordersInProduction}
        icon={Package}
        iconColor="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-100 dark:bg-orange-900"
        badge={{
          text: `${totalOrdersLength > 0 ? ((ordersInProduction / totalOrdersLength) * 100).toFixed(1) : 0}% do total`,
          className: "bg-orange-500 text-white border-0"
        }}
      />

      <StatCard
        title="Prontos"
        value={ordersReady}
        icon={CheckCircle2}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900"
        badge={{
          text: "Aguardando entrega",
          className: "bg-green-500 text-white border-0"
        }}
      />

      <StatCard
        title="Valor Total"
        value={formatCurrency(totalOrdersMonth)}
        icon={DollarSign}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-900"
        badge={{
          text: "Este mês",
          className: "bg-purple-500 text-white border-0"
        }}
      />
    </div>
  );
} 