import { StatCard } from "@/components/ui/StatCard";
import { Users, Crown, Calendar, DollarSign, TrendingUp } from "lucide-react";

interface EmployeeStatsCardsProps {
  totalEmployees: number;
  topEmployees: number;
  newThisMonth: number;
  activeEmployees: number;
  totalSales: number;
  totalRevenue: number;
}

export function EmployeeStatsCards({ 
  totalEmployees, 
  topEmployees, 
  newThisMonth, 
  activeEmployees,
  totalSales,
  totalRevenue
}: EmployeeStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total de Funcionários"
        value={totalEmployees.toLocaleString()}
        icon={Users}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900"
        badge={{
          text: `+${Math.floor(totalEmployees * 0.1)} este mês`,
          className: "bg-blue-500 text-white border-0"
        }}
      />

      <StatCard
        title="Top Vendedores"
        value={topEmployees}
        icon={Crown}
        iconColor="text-yellow-600 dark:text-yellow-400"
        bgColor="bg-yellow-100 dark:bg-yellow-900"
        badge={{
          text: "10+ vendas",
          className: "bg-yellow-500 text-white border-0"
        }}
      />

      <StatCard
        title="Vendas este Mês"
        value={totalSales}
        icon={TrendingUp}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900"
        badge={{
          text: "pedidos",
          className: "bg-green-500 text-white border-0"
        }}
      />

      <StatCard
        title="Faturamento Mensal"
        value={`R$ ${totalRevenue.toLocaleString()}`}
        icon={DollarSign}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-900"
        badge={{
          text: "este mês",
          className: "bg-purple-500 text-white border-0"
        }}
      />
    </div>
  );
} 