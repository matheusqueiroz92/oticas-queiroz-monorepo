"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye } from "lucide-react";
import { Product } from "@/app/_types/product";
import { getProductTypeBadge, getStockStatusInfo, getProductImageUrl } from "@/app/_utils/product-utils";
import { ProductActions } from "./ProductActions";

interface ProductCardWithActionsProps {
  product: Product;
  formatCurrency: (value: number) => string;
  navigateToProductDetails: (id: string) => void;
  onRefresh: () => void;
}

export function ProductCardWithActions({
  product,
  formatCurrency,
  navigateToProductDetails,
  onRefresh,
}: ProductCardWithActionsProps) {
  const imageUrl = getProductImageUrl(product.image || null);
  const typeBadge = getProductTypeBadge(product.productType);
  const stockStatus = getStockStatusInfo(product);

  return (
    <Card className="hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden group border border-gray-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800 flex flex-col h-full">
      <div className="relative flex-1 flex flex-col">
        {/* Imagem do produto */}
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-slate-700 relative overflow-hidden border-b border-gray-200 dark:border-slate-700">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:bg-slate-700">
              <Package className="w-12 h-12 text-gray-400 dark:text-slate-500" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent dark:from-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Badge do tipo de produto */}
          <div className="absolute top-3 left-3">
            <Badge className={`${typeBadge.className} text-xs font-medium shadow-sm backdrop-blur-sm`}>
              {typeBadge.label}
            </Badge>
          </div>
          {/* Status do estoque */}
          {stockStatus && (
            <div className="absolute top-3 right-3">
              <Badge className={`${stockStatus.className} text-xs font-medium shadow-sm backdrop-blur-sm`}>
                {stockStatus.color === "red" ? "Esgotado" : 
                 stockStatus.color === "yellow" ? "Baixo" : "Disponível"}
              </Badge>
            </div>
          )}
          {/* Botão de visualização rápida */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={() => navigateToProductDetails(product._id)}
              className="bg-slate-700/80 text-white border-none shadow-none hover:bg-slate-800/90"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        </div>
        {/* Conteúdo do card */}
        <CardContent className="p-4 bg-white dark:bg-slate-900 flex flex-col flex-1">
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Nome do produto */}
            <div>
              <h3 className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[2.5rem] text-gray-900 dark:text-slate-100"
                  onClick={() => navigateToProductDetails(product._id)}>
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">{product.brand}</p>
              )}
            </div>
            {/* Preço */}
            <div className="space-y-1">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(product.sellPrice)}
              </p>
              {product.costPrice && (
                <p className="text-xs text-muted-foreground dark:text-slate-400">
                  Custo: {formatCurrency(product.costPrice)}
                </p>
              )}
            </div>
            {/* Informações do estoque para produtos com estoque */}
            {stockStatus && stockStatus.color !== "red" && (
              <div className="text-xs text-muted-foreground dark:text-slate-400">
                {stockStatus.label}
              </div>
            )}
            {/* Descrição (se houver) */}
            {product.description && (
              <p className="text-xs text-muted-foreground dark:text-slate-400 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
          {/* Botões de ação */}
          <div className="flex items-center gap-2 pt-2 mt-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToProductDetails(product._id)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver
            </Button>
            <ProductActions 
              product={product}
              onViewDetails={navigateToProductDetails}
              onRefresh={onRefresh}
            />
          </div>
        </CardContent>
      </div>
    </Card>
  );
} 