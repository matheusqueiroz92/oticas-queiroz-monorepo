"use client";

import { Package, AlertTriangle, XCircle, DollarSign } from "lucide-react";
import { Product } from "@/app/_types/product";
import { StatCard } from "@/components/ui/StatCard";

interface ProductsStatisticsProps {
  products: Product[];
  formatCurrency: (value: number) => string;
}

export function ProductsStatistics({ products, formatCurrency }: ProductsStatisticsProps) {
  const totalProducts = products.length;
  
  const lowStockProducts = products.filter(product => {
    if (product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') {
      const stock = (product as any).stock || 0;
      return stock > 0 && stock <= 5;
    }
    return false;
  }).length;

  const outOfStockProducts = products.filter(product => {
    if (product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') {
      const stock = (product as any).stock || 0;
      return stock === 0;
    }
    return false;
  }).length;

  const totalInventoryValue = products.reduce((sum, product) => {
    if (product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') {
      const stock = (product as any).stock || 0;
      return sum + (product.costPrice || product.sellPrice) * stock;
    }
    return sum + (product.costPrice || product.sellPrice);
  }, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total de Produtos"
        value={totalProducts.toLocaleString()}
        icon={Package}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-100 dark:bg-blue-900"
        badge={{
          text: "produtos cadastrados",
          className: "bg-blue-500 text-white border-0"
        }}
      />

      <StatCard
        title="Estoque Baixo"
        value={lowStockProducts}
        icon={AlertTriangle}
        iconColor="text-yellow-600 dark:text-yellow-400"
        bgColor="bg-yellow-100 dark:bg-yellow-900"
        badge={{
          text: "≤5 unidades",
          className: "bg-yellow-500 text-white border-0"
        }}
      />

      <StatCard
        title="Sem Estoque"
        value={outOfStockProducts}
        icon={XCircle}
        iconColor="text-red-600 dark:text-red-400"
        bgColor="bg-red-100 dark:bg-red-900"
        badge={{
          text: "produtos em falta",
          className: "bg-red-500 text-white border-0"
        }}
      />

      <StatCard
        title="Valor do Estoque"
        value={formatCurrency(totalInventoryValue)}
        icon={DollarSign}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-900"
        badge={{
          text: "valor total em estoque",
          className: "bg-green-500 text-white border-0"
        }}
      />
    </div>
  );
} 