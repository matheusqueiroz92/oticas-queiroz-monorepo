import { StatCard } from "@/components/ui/StatCard";
import { 
  Building, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Image,
  TrendingUp
} from "lucide-react";

interface InstitutionStatsCardsProps {
  totalInstitutions: number;
  activeInstitutions: number;
  inactiveInstitutions: number;
  institutionsWithContact: number;
  institutionsWithImage: number;
  averageInstitutionsPerMonth: number;
}

export function InstitutionStatsCards({
  totalInstitutions,
  activeInstitutions,
  inactiveInstitutions,
  institutionsWithContact,
  institutionsWithImage,
  averageInstitutionsPerMonth,
}: InstitutionStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total de Instituições"
        value={totalInstitutions.toLocaleString()}
        icon={Building}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900"
        badge={{
          text: "cadastradas",
          className: "bg-blue-500 text-white border-0"
        }}
      />

      <StatCard
        title="Instituições Ativas"
        value={activeInstitutions}
        icon={CheckCircle}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900"
        badge={{
          text: `${totalInstitutions > 0 ? Math.round((activeInstitutions / totalInstitutions) * 100) : 0}%`,
          className: "bg-green-500 text-white border-0"
        }}
      />

      <StatCard
        title="Instituições Inativas"
        value={inactiveInstitutions}
        icon={XCircle}
        iconColor="text-red-600 dark:text-red-400"
        bgColor="bg-red-100 dark:bg-red-900"
        badge={{
          text: `${totalInstitutions > 0 ? Math.round((inactiveInstitutions / totalInstitutions) * 100) : 0}%`,
          className: "bg-red-500 text-white border-0"
        }}
      />

      <StatCard
        title="Com Contato"
        value={institutionsWithContact}
        icon={Mail}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-900"
        badge={{
          text: "com dados",
          className: "bg-purple-500 text-white border-0"
        }}
      />

      <StatCard
        title="Com Imagem"
        value={institutionsWithImage}
        icon={Image}
        iconColor="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-100 dark:bg-orange-900"
        badge={{
          text: "com foto",
          className: "bg-orange-500 text-white border-0"
        }}
      />

      <StatCard
        title="Média Mensal"
        value={averageInstitutionsPerMonth.toFixed(1)}
        icon={TrendingUp}
        iconColor="text-indigo-600 dark:text-indigo-400"
        bgColor="bg-indigo-100 dark:bg-indigo-900"
        badge={{
          text: "por mês",
          className: "bg-indigo-500 text-white border-0"
        }}
      />
    </div>
  );
}