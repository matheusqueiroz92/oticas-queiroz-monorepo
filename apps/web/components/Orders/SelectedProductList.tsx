import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "../../app/types/product";
import { formatCurrency } from "../../app/utils/formatters";
// Importe diretamente as funções utilitárias
import { getCorrectPrice, normalizeProduct } from "@/app/utils/product-utils";

interface SelectedProductsListProps {
  products: Product[];
  onUpdatePrice: (id: string, price: number) => void;
  onRemoveProduct: (id: string) => void;
}

// Tradução dos tipos de produto
const productTypeTranslations: Record<string, string> = {
  lenses: "Lentes",
  clean_lenses: "Limpa-lentes",
  prescription_frame: "Armação de grau",
  sunglasses_frame: "Armação solar"
};

export default function SelectedProductsList({
  products,
  onUpdatePrice,
  onRemoveProduct,
}: SelectedProductsListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum produto selecionado
      </div>
    );
  }
  console.log('Produtos originais:', products);
  console.log('-----------------------------------------------');

  // Normalizar cada produto para garantir consistência
  const normalizedProducts = products.map(product => normalizeProduct(product));
  console.log('Produtos normalizados:', normalizedProducts);
  console.log('-----------------------------------------------');
  
  // Calcular total usando getCorrectPrice para garantir valores corretos
  const total = normalizedProducts.reduce((sum, product) => {
    const price = getCorrectPrice(product);
    console.log('Preço:', price);
    console.log('-----------------------------------------------');
    return sum + price;
  }, 0);

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left">Produto</th>
            <th className="px-4 py-2 text-left">Tipo</th>
            <th className="px-4 py-2 text-right">Preço</th>
            <th className="px-4 py-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {normalizedProducts.map((product) => (
            <tr key={product._id} className="border-t">
              <td className="px-4 py-2">{product.name}</td>
              <td className="px-4 py-2">{getProductTypeLabel(product.productType)}</td>
              <td className="px-4 py-2 text-right">
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
                  className="w-24 inline-block"
                />
              </td>
              <td className="px-4 py-2 text-right">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onRemoveProduct(product._id)}
                >
                  Remover
                </Button>
              </td>
            </tr>
          ))}
          <tr className="border-t font-semibold">
            <td colSpan={2} className="px-4 py-3 text-right">Total:</td>
            <td className="px-4 py-3 text-right">{formatCurrency(total)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Função para obter o rótulo do tipo de produto em português
function getProductTypeLabel(type: Product['productType']): string {
  if (!type) return "Tipo não especificado";
  return productTypeTranslations[type] || String(type);
}