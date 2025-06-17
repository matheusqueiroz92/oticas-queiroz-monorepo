"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Edit, Trash2, Eye } from "lucide-react";
import { Product } from "@/app/_types/product";
import { getProductTypeName } from "@/app/_services/productService";
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
  const imageUrl = product.image 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${product.image}`
    : null;

  const getProductTypeBadge = (type: string) => {
    const colors = {
      lenses: "bg-blue-100 text-blue-800",
      clean_lenses: "bg-green-100 text-green-800", 
      prescription_frame: "bg-purple-100 text-purple-800",
      sunglasses_frame: "bg-orange-100 text-orange-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStockStatus = () => {
    if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
      return null;
    }
    
    const stock = (product as any).stock || 0;
    if (stock === 0) {
      return { label: "Sem estoque", color: "bg-red-100 text-red-800" };
    } else if (stock <= 5) {
      return { label: "Estoque baixo", color: "bg-yellow-100 text-yellow-800" };
    }
    return { label: `${stock} un.`, color: "bg-green-100 text-green-800" };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className="hover:shadow-lg transition-all duration-200 overflow-hidden group">
      <div className="relative">
        {/* Imagem do produto - menor */}
        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          {/* Badge do tipo de produto */}
          <div className="absolute top-1 left-1">
            <Badge className={`${getProductTypeBadge(product.productType)} text-xs font-medium`}>
              {getProductTypeName(product.productType)}
            </Badge>
          </div>
        </div>

        {/* Conteúdo do card - compacto */}
        <CardContent className="p-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => navigateToProductDetails(product._id)}>
              {product.name}
            </h3>
            
            {product.brand && (
              <p className="text-xs text-gray-600">{product.brand}</p>
            )}
            
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-green-600">
                {formatCurrency(product.sellPrice)}
              </p>
              
              {stockStatus && (
                <Badge className={`${stockStatus.color} text-xs`}>
                  {stockStatus.label}
                </Badge>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToProductDetails(product._id)}
                className="h-8 px-2 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Ver
              </Button>
              
              <div className="flex gap-1">
                <ProductActions 
                  product={product}
                  onViewDetails={navigateToProductDetails}
                  onRefresh={onRefresh}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
} 