import { StatCard } from "@/components/ui/StatCard";
import { Users, UserCheck, UserX, DollarSign, TrendingUp, Calendar } from "lucide-react";

interface LegacyClientStatsCardsProps {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalDebt: number;
  averageDebt: number;
  recentClients: number;
}

export function LegacyClientStatsCards({
  totalClients,
  activeClients,
  inactiveClients,
  totalDebt,
  averageDebt,
  recentClients,
}: LegacyClientStatsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total de Clientes"
        value={totalClients.toLocaleString()}
        icon={Users}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900"
        badge={{
          text: "cadastrados",
          className: "bg-blue-500 text-white border-0"
        }}
      />

      <StatCard
        title="Clientes Ativos"
        value={activeClients}
        icon={UserCheck}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900"
        badge={{
          text: `${totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0}%`,
          className: "bg-green-500 text-white border-0"
        }}
      />

      <StatCard
        title="Clientes Inativos"
        value={inactiveClients}
        icon={UserX}
        iconColor="text-red-600 dark:text-red-400"
        bgColor="bg-red-100 dark:bg-red-900"
        badge={{
          text: `${totalClients > 0 ? Math.round((inactiveClients / totalClients) * 100) : 0}%`,
          className: "bg-red-500 text-white border-0"
        }}
      />

      <StatCard
        title="Dívida Total"
        value={formatCurrency(totalDebt)}
        icon={DollarSign}
        iconColor="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-100 dark:bg-orange-900"
        badge={{
          text: "em dívidas",
          className: "bg-orange-500 text-white border-0"
        }}
      />

      <StatCard
        title="Dívida Média"
        value={formatCurrency(averageDebt)}
        icon={TrendingUp}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-900"
        badge={{
          text: "por cliente",
          className: "bg-purple-500 text-white border-0"
        }}
      />

      <StatCard
        title="Novos Clientes"
        value={recentClients}
        icon={Calendar}
        iconColor="text-indigo-600 dark:text-indigo-400"
        bgColor="bg-indigo-100 dark:bg-indigo-900"
        badge={{
          text: "últimos 30 dias",
          className: "bg-indigo-500 text-white border-0"
        }}
      />
    </div>
  );
} 