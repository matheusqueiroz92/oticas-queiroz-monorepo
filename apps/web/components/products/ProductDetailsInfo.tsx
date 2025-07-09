import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, User } from "lucide-react";
import { formatCurrency } from "@/app/_utils/product-utils";
import { getStockStatusConfig } from "@/app/_utils/product-details-utils";

interface ProductDetailsInfoProps {
  product: any;
}

export function ProductDetailsInfo({ product }: ProductDetailsInfoProps) {
  const stockStatus = getStockStatusConfig(product);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            {product.brand && (
              <p className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Marca: {product.brand}
              </p>
            )}
          </div>

          {product.description && (
            <div>
              <h3 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                Descrição
              </h3>
              <p className="text-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Price section */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(product.sellPrice)}
              </p>
              {product.costPrice && (
                <p className="text-sm text-muted-foreground">
                  Preço de custo: <span className="line-through">{formatCurrency(product.costPrice)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Stock status */}
          {stockStatus && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${stockStatus.className}`}>
              <stockStatus.icon className="h-5 w-5" />
              <span className="font-medium">{stockStatus.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 