import { StatCard } from "@/components/ui/StatCard";
import { Package, Eye, Glasses, DollarSign } from "lucide-react";
import { formatCurrency } from "@/app/_utils/product-utils";

interface ProductsStatsCardsProps {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  lensesCount: number;
  cleanLensesCount: number;
  prescriptionFramesCount: number;
  sunglassesFramesCount: number;
  totalStockValue: number;
}

export function ProductsStatsCards({
  totalProducts,
  lowStockProducts,
  // outOfStockProducts,
  lensesCount,
  cleanLensesCount,
  prescriptionFramesCount,
  sunglassesFramesCount,
  totalStockValue,
}: ProductsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total de Produtos"
        value={totalProducts.toLocaleString()}
        icon={Package}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900"
        description={`${prescriptionFramesCount + sunglassesFramesCount} armações`}
      />

      <StatCard
        title="Lentes"
        value={lensesCount + cleanLensesCount}
        icon={Eye}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-900"
        description={`${lensesCount} comuns, ${cleanLensesCount} limpeza`}
      />

      <StatCard
        title="Armações"
        value={prescriptionFramesCount + sunglassesFramesCount}
        icon={Glasses}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900"
        description={`${prescriptionFramesCount} grau, ${sunglassesFramesCount} sol`}
      />

      <StatCard
        title="Valor do Estoque"
        value={formatCurrency(totalStockValue)}
        icon={DollarSign}
        iconColor="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-100 dark:bg-orange-900"
        description={`${lowStockProducts} com estoque baixo`}
      />
    </div>
  );
} 