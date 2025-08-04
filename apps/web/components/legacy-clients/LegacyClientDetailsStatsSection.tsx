import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Star
} from "lucide-react";

interface LegacyClientDetailsStatsSectionProps {
  totalDebt: number;
  currentDebt: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: Date;
  totalPayments: number;
  averagePayment: number;
  daysSinceLastPayment?: number;
  status: "active" | "inactive";
  createdAt?: Date;
}

export function LegacyClientDetailsStatsSection({
  totalDebt,
  currentDebt,
  lastPaymentAmount,
  lastPaymentDate,
  totalPayments,
  averagePayment,
  daysSinceLastPayment,
  status,
  createdAt,
}: LegacyClientDetailsStatsSectionProps) {
  const stats = [
    {
      title: "Dívida Total",
      value: formatCurrency(totalDebt),
      icon: DollarSign,
      description: "Valor total em dívidas",
      color: totalDebt > 0 ? "text-red-600" : "text-green-600",
    },
    {
      title: "Dívida Atual",
      value: formatCurrency(currentDebt),
      icon: AlertTriangle,
      description: "Dívida pendente atual",
      color: currentDebt > 0 ? "text-red-600" : "text-green-600",
    },
    {
      title: "Último Pagamento",
      value: lastPaymentAmount ? formatCurrency(lastPaymentAmount) : "N/A",
      icon: CreditCard,
      description: lastPaymentDate ? `em ${formatDate(lastPaymentDate)}` : "Nenhum pagamento",
      color: "text-blue-600",
    },
    {
      title: "Total de Pagamentos",
      value: totalPayments.toString(),
      icon: TrendingUp,
      description: "Quantidade de pagamentos realizados",
      color: "text-green-600",
    },
    {
      title: "Média por Pagamento",
      value: formatCurrency(averagePayment),
      icon: DollarSign,
      description: "Valor médio dos pagamentos",
      color: "text-blue-600",
    },
    {
      title: "Dias sem Pagar",
      value: daysSinceLastPayment ? `${daysSinceLastPayment} dias` : "N/A",
      icon: Clock,
      description: "Tempo desde o último pagamento",
      color: daysSinceLastPayment && daysSinceLastPayment > 30 ? "text-red-600" : "text-gray-600",
    },
    {
      title: "Status",
      value: status === "active" ? "Ativo" : "Inativo",
      icon: status === "active" ? CheckCircle : AlertTriangle,
      description: "Status atual do cliente",
      color: status === "active" ? "text-green-600" : "text-red-600",
    },
    {
      title: "Cliente Desde",
      value: createdAt ? formatDate(createdAt) : "N/A",
      icon: Star,
      description: "Data de cadastro",
      color: "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 