import { StatCard } from "@/components/ui/StatCard";
import { Users, Crown, Calendar, DollarSign } from "lucide-react";

interface CustomerStatsCardsProps {
  totalCustomers: number;
  vipCustomers: number;
  newThisMonth: number;
  activeCustomers: number;
}

export function CustomerStatsCards({ 
  totalCustomers, 
  vipCustomers, 
  newThisMonth, 
  activeCustomers 
}: CustomerStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total de Clientes"
        value={totalCustomers.toLocaleString()}
        icon={Users}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900"
        badge={{
          text: `+${Math.floor(totalCustomers * 0.1)} esta semana`,
          className: "bg-blue-500 text-white border-0"
        }}
      />

      <StatCard
        title="Clientes VIP"
        value={vipCustomers}
        icon={Crown}
        iconColor="text-yellow-600 dark:text-yellow-400"
        bgColor="bg-yellow-100 dark:bg-yellow-900"
        badge={{
          text: "5+ compras",
          className: "bg-yellow-500 text-white border-0"
        }}
      />

      <StatCard
        title="Novos este Mês"
        value={newThisMonth}
        icon={Calendar}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900"
        badge={{
          text: "este mês",
          className: "bg-green-500 text-white border-0"
        }}
      />

      <StatCard
        title="Clientes Ativos"
        value={activeCustomers}
        icon={DollarSign}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-900"
        badge={{
          text: "com compras",
          className: "bg-purple-500 text-white border-0"
        }}
      />
    </div>
  );
} 