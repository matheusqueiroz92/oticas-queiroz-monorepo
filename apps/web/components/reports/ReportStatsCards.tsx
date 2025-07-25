import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Calendar
} from "lucide-react";

interface ReportStatsCardsProps {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  processingReports: number;
  errorReports: number;
  recentReports: number;
}

export function ReportStatsCards({
  totalReports,
  completedReports,
  pendingReports,
  processingReports,
  errorReports,
  recentReports,
}: ReportStatsCardsProps) {
  const stats = [
    {
      title: "Total de Relatórios",
      value: totalReports,
      icon: FileText,
      description: "Todos os relatórios",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Concluídos",
      value: completedReports,
      icon: CheckCircle,
      description: "Relatórios prontos",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pendentes",
      value: pendingReports,
      icon: Clock,
      description: "Aguardando processamento",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Processando",
      value: processingReports,
      icon: TrendingUp,
      description: "Em processamento",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Com Erro",
      value: errorReports,
      icon: AlertCircle,
      description: "Relatórios com erro",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Últimos 30 Dias",
      value: recentReports,
      icon: Calendar,
      description: "Relatórios recentes",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 