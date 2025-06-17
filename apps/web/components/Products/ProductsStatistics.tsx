"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, XCircle, DollarSign } from "lucide-react";
import { Product } from "@/app/_types/product";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">produtos cadastrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockProducts}</div>
          <p className="text-xs text-muted-foreground">≤5 unidades</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{outOfStockProducts}</div>
          <p className="text-xs text-muted-foreground">produtos em falta</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
          <p className="text-xs text-muted-foreground">valor total em estoque</p>
        </CardContent>
      </Card>
    </div>
  );
} 