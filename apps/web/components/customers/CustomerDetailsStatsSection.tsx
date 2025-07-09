import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Gasto
          </CardTitle>
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          <p className="text-xs text-green-600 mt-1">
            +{formatCurrency(currentMonthSpent)} este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pedidos
          </CardTitle>
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrders}</div>
          <p className="text-xs text-blue-600 mt-1">
            +{currentMonthOrders} este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Óculos
          </CardTitle>
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalGlasses}</div>
          <p className="text-xs text-purple-600 mt-1">
            {deliveredOrdersCount > 0 && lastDeliveryDate 
              ? `Último: ${formatDate(lastDeliveryDate)}` 
              : "Nenhum entregue"
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Fidelidade
          </CardTitle>
          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loyaltyPoints.toLocaleString()}</div>
          <p className="text-xs text-yellow-600 mt-1">
            Pontos acumulados
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 