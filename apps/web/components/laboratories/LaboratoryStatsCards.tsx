import { StatCard } from "@/components/ui/StatCard";
import { Beaker, CheckCircle, Calendar, MapPin } from "lucide-react";

interface LaboratoryStatsCardsProps {
  totalLaboratories: number;
  activeLaboratories: number;
  inactiveLaboratories: number;
  newThisMonth: number;
  topCities: Array<{ city: string; count: number }>;
}

export function LaboratoryStatsCards({ 
  totalLaboratories, 
  activeLaboratories,  
  newThisMonth,
  topCities
}: LaboratoryStatsCardsProps) {
  const topCity = topCities[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total de Laboratórios"
        value={totalLaboratories.toLocaleString()}
        icon={Beaker}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900"
        badge={{
          text: `+${Math.floor(totalLaboratories * 0.1)} este mês`,
          className: "bg-blue-500 text-white border-0"
        }}
      />

      <StatCard
        title="Laboratórios Ativos"
        value={activeLaboratories}
        icon={CheckCircle}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900"
        badge={{
          text: `${Math.round((activeLaboratories / totalLaboratories) * 100)}% ativos`,
          className: "bg-green-500 text-white border-0"
        }}
      />

      <StatCard
        title="Novos este Mês"
        value={newThisMonth}
        icon={Calendar}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-900"
        badge={{
          text: "este mês",
          className: "bg-purple-500 text-white border-0"
        }}
      />

      <StatCard
        title="Cidade Principal"
        value={topCity ? topCity.city : "N/A"}
        icon={MapPin}
        iconColor="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-100 dark:bg-orange-900"
        badge={{
          text: topCity ? `${topCity.count} laboratórios` : "N/A",
          className: "bg-orange-500 text-white border-0"
        }}
      />
    </div>
  );
} 