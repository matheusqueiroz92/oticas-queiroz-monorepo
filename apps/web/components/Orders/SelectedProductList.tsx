import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "../../app/types/product";

interface SelectedProductsListProps {
  products: Product[];
  onUpdatePrice: (id: string | undefined, price: number) => void;
  onRemoveProduct: (id: string | undefined) => void;
}

export default function SelectedProductsList({
  products,
  onUpdatePrice,
  onRemoveProduct,
}: SelectedProductsListProps) {
  if (products.length === 0) {
    return null;
  }

  const total = products.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div className="mt-2 border rounded-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Produto
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Preço
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr
              key={
                product._id ||
                `product-${Math.random().toString(36).substr(2, 9)}`
              }
            >
              <td className="px-3 py-2">{product.name}</td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  value={product.price}
                  onChange={(e) =>
                    onUpdatePrice(
                      product._id,
                      Number.parseFloat(e.target.value)
                    )
                  }
                  className="w-24"
                />
              </td>
              <td className="px-3 py-2 text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveProduct(product._id)}
                >
                  Remover
                </Button>
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50">
            <td className="px-3 py-2 font-medium">Total</td>
            <td className="px-3 py-2 font-medium">R$ {total.toFixed(2)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
