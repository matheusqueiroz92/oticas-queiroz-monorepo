import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Package, ShoppingBag } from "lucide-react";
import { Product } from "@/app/_types/product";
import { getProductTypeName } from "@/app/_services/productService";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  formatCurrency: (value: number) => string;
  navigateToProductDetails: (id: string) => void;
  navigateToEditProduct: (id: string) => void;
}

export function ProductCard({
  product,
  formatCurrency,
  navigateToProductDetails,
  navigateToEditProduct,
}: ProductCardProps) {
  // Função que retorna o ícone correto para cada tipo de produto
  const getProductTypeIcon = (type: Product['productType']) => {
    switch (type) {
      case "lenses":
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case "clean_lenses":
        return <Package className="h-4 w-4 text-green-500" />;
      case "prescription_frame":
        return <ShoppingBag className="h-4 w-4 text-purple-500" />;
      case "sunglasses_frame":
        return <ShoppingBag className="h-4 w-4 text-orange-500" />;
      default:
        return <ShoppingBag className="h-4 w-4 text-gray-500" />;
    }
  };

  // Renderizar o status de estoque
  const renderStockBadge = () => {
    if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
      return null;
    }
    
    const stock = (product as any).stock || 0;
    
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="absolute top-2 right-2">
          Sem estoque
        </Badge>
      );
    }
    
    if (stock <= 5) {
      return (
        <Badge variant="outline" className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600">
          Estoque baixo: {stock}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="absolute top-2 right-2 bg-green-50 text-green-700 border-green-200">
        Em estoque: {stock}
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-gray-50">
        {renderStockBadge()}
        {product.image ? (
          <Image
            width={200}
            height={200}
            src={process.env.NEXT_PUBLIC_API_URL+product.image}
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Package className="h-16 w-16 opacity-20" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="h-9"
            onClick={(e) => {
              e.stopPropagation();
              navigateToProductDetails(product._id);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              navigateToEditProduct(product._id);
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-1">
          <Badge variant="outline" className="flex items-center gap-1">
            {getProductTypeIcon(product.productType)}
            <span className="text-xs">{getProductTypeName(product.productType)}</span>
          </Badge>
          {product.brand && (
            <span className="text-xs text-muted-foreground">{product.brand}</span>
          )}
        </div>
        <h3 className="font-semibold truncate mt-1">{product.name}</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(product.sellPrice)}
          </span>
          {(product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
              Estoque: {(product as any).stock || 0}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}