import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { buildProductImageUrl, getProductTypeBadgeConfig } from "@/app/_utils/product-details-utils";

interface ProductDetailsImageProps {
  product: any;
}

export function ProductDetailsImage({ product }: ProductDetailsImageProps) {
  const imageUrl = buildProductImageUrl(product.image);
  const typeBadge = getProductTypeBadgeConfig(product.productType);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/60 relative overflow-hidden group">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <Package className="w-16 h-16 mb-4" />
              <p className="text-sm">Imagem não disponível</p>
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            <Badge className={`${typeBadge.className} font-medium`}>
              {typeBadge.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 