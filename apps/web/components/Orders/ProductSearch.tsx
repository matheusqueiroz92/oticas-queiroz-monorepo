import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Product } from "../../app/types/product";
import { formatCurrency } from "../../app/utils/formatters";
import { normalizeProduct } from "@/app/utils/product-utils";
import { Badge } from "@/components/ui/badge";

interface ProductSearchProps {
  products: Product[];
  form: any;
  onProductAdd: (product: Product) => void;
  selectedProducts: Product[];
}

const productTypeTranslations: Record<string, string> = {
  lenses: "Lentes",
  clean_lenses: "Limpa-lentes",
  prescription_frame: "Armação de grau",
  sunglasses_frame: "Armação solar"
};

export default function ProductSearch({
  products,
  form,
  onProductAdd,
  selectedProducts,
}: ProductSearchProps) {
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);

  const normalizedApiProducts = useMemo(() => {
    return products.map(p => {
      return normalizeProduct(p) as Product;
    });
  }, [products]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setFilteredProducts([]);
      return;
    }

    const searchLower = productSearch.toLowerCase();

    const filtered = normalizedApiProducts
      .filter((product) => product.name?.toLowerCase().includes(searchLower))
      .filter((product) => !selectedProducts.some(p => p._id === product._id));
      
    setFilteredProducts(filtered);
    setShowResults(true);
  }, [productSearch, normalizedApiProducts, selectedProducts]);

  const handleAddProduct = (product: Product) => {
    const normalizedProduct = normalizeProduct(product) as Product;
    
    const productWithPrice = {
      ...normalizedProduct,
      sellPrice: typeof normalizedProduct.sellPrice === 'number' && !isNaN(normalizedProduct.sellPrice)
        ? normalizedProduct.sellPrice
        : 0
    };
    
    onProductAdd(productWithPrice);
    setProductSearch("");
    setShowResults(false);
  };

  const handleNavigateToNewProduct = () => {
    if (window) {
      window.localStorage.setItem('pendingOrderFormData', JSON.stringify(form.getValues()));
    }
    window.open('/products/new', '_blank');
  };

  const getProductTypeLabel = (type?: string): string => {
    if (!type) return "Não especificado";
    return productTypeTranslations[type] || type;
  };

  return (
    <FormField
      control={form.control}
      name="products"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Adicionar Produtos</FormLabel>
          <div className="relative">
            <Input
              placeholder="Digite o nome do produto"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onFocus={() => setShowResults(!!productSearch)}
              onBlur={() => {
                setTimeout(() => setShowResults(false), 200);
              }}
            />
            {showResults && productSearch && (
              <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
                <ul className="py-1">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <li key={product._id} className="p-0">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer"
                        onClick={() => handleAddProduct(product)}
                        aria-label={`Adicionar produto ${product.name}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-gray-500">
                                {getProductTypeLabel(product.productType)}
                              </span>
                              
                              {/* Indicador de estoque para armações */}
                              {(product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') && (
                                <>
                                  <span className="text-gray-300 mx-1">•</span>
                                  {(product as any).stock > 0 ? (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs py-0 px-1 ${
                                        (product as any).stock <= 5 
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : 'bg-green-50 text-green-800 border-green-200'
                                      }`}
                                    >
                                      Estoque: {(product as any).stock}
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs py-0 px-1">
                                      Sem estoque
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <span className="text-sm">
                            {formatCurrency(product.sellPrice || 0)}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="p-2 text-sm text-gray-500">
                    Nenhum produto encontrado com este nome.
                  </li>
                )}
                  
                  <li className="border-t">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer text-blue-600"
                      onClick={handleNavigateToNewProduct}
                    >
                      + Cadastrar novo produto
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}