import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "../../app/_types/product";
import { formatCurrency } from "../../app/_utils/formatters";
import { getCorrectPrice, getProductTypeLabel, normalizeProduct } from "@/app/_utils/product-utils";
import { AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SelectedProductsListProps {
  products: Product[];
  onUpdatePrice: (id: string, price: number) => void;
  onRemoveProduct: (id: string) => void;
}

export default function SelectedProductsList({
  products,
  onUpdatePrice,
  onRemoveProduct,
}: SelectedProductsListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-3 text-muted-foreground text-sm">
        Nenhum produto selecionado
      </div>
    );
  }

  const normalizedProducts = products.map(product => normalizeProduct(product));
  
  const total = normalizedProducts.reduce((sum, product) => {
    const price = getCorrectPrice(product);
    return sum + price;
  }, 0);

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left text-xs">Produto</th>
            <th className="px-3 py-2 text-left text-xs">Tipo</th>
            <th className="px-3 py-2 text-right text-xs">Preço</th>
            <th className="px-3 py-2 text-center text-xs w-16">Ação</th>
          </tr>
        </thead>
        <tbody>
          {normalizedProducts.map((product) => (
            <tr key={product._id} className="border-t">
              <td className="px-3 py-2">
                <div>
                  <span className="font-medium text-sm">{product.name}</span>
                  
                  {(product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') && 
                  (product as any).stock <= 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="destructive" className="text-xs py-0 px-1 h-4">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Sem estoque
                      </Badge>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 text-xs text-gray-600">
                {getProductTypeLabel(product.productType)}
              </td>
              <td className="px-3 py-2 text-right">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.sellPrice || 0}
                  onChange={(e) =>
                    onUpdatePrice(
                      product._id,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-20 h-7 text-right text-xs"
                />
              </td>
              <td className="px-3 py-2 text-center">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onRemoveProduct(product._id)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </td>
            </tr>
          ))}
          <tr className="border-t font-semibold bg-muted">
            <td colSpan={2} className="px-3 py-2 text-right text-sm">Total:</td>
            <td className="px-3 py-2 text-right text-sm">{formatCurrency(total)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}