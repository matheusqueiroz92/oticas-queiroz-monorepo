import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Product } from "../../app/_types/product";
import { formatCurrency } from "../../app/_utils/formatters";
import { normalizeProduct } from "@/app/_utils/product-utils";
import { Badge } from "@/components/ui/badge";
import { api } from "@/app/_services/authService";
import { API_ROUTES } from "@/app/_constants/api-routes";
import { Loader2 } from "lucide-react";
import debounce from 'lodash/debounce';

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
  const [isSearching, setIsSearching] = useState(false);

  // Função para buscar produtos do servidor
  const fetchProducts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }

    setIsSearching(true);
    try {
      // Construir a URL com o parâmetro de pesquisa
      const searchParams = new URLSearchParams();
      searchParams.append('search', searchTerm);
      searchParams.append('_t', Date.now().toString()); // Evitar cache
      
      const response = await api.get(`${API_ROUTES.PRODUCTS.BASE}?${searchParams.toString()}`);
      
      // Processar a resposta
      let productsData: Product[] = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }
      
      // Normalizar os produtos
      const normalizedProducts = productsData.map(p => normalizeProduct(p) as Product);
      
      // Filtrar os produtos que já estão selecionados
      const availableProducts = normalizedProducts.filter(
        product => !selectedProducts.some(p => p._id === product._id)
      );
      
      setFilteredProducts(availableProducts);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      // Fallback para filtragem local se a API falhar
      const searchLower = searchTerm.toLowerCase();
      const localFiltered = products
        .filter((product) => product.name?.toLowerCase().includes(searchLower))
        .filter((product) => !selectedProducts.some(p => p._id === product._id));
        
      setFilteredProducts(localFiltered);
    } finally {
      setIsSearching(false);
    }
  }, [products, selectedProducts]);

  // Debounce para não fazer muitas requisições
  const debouncedFetchProducts = useCallback(
    debounce((searchTerm: string) => fetchProducts(searchTerm), 300),
    [fetchProducts]
  );

  useEffect(() => {
    if (productSearch.trim().length >= 2) {
      setShowResults(true);
      debouncedFetchProducts(productSearch);
    } else if (productSearch.trim()) {
      // Para buscas com 1 caractere, filtra apenas localmente
      const searchLower = productSearch.toLowerCase();
      const localFiltered = products
        .filter((product) => product.name?.toLowerCase().includes(searchLower))
        .filter((product) => !selectedProducts.some(p => p._id === product._id));
        
      setFilteredProducts(localFiltered);
      setShowResults(true);
    } else {
      setFilteredProducts([]);
      setShowResults(false);
    }
    
    // Limpeza ao desmontar o componente
    return () => {
      debouncedFetchProducts.cancel();
    };
  }, [productSearch, products, selectedProducts, debouncedFetchProducts]);

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
              className="placeholder:text-blue-300" 
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
                {isSearching ? (
                  <div className="p-3 text-center">
                    <Loader2 className="animate-spin h-5 w-5 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Buscando produtos...</p>
                  </div>
                ) : (
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
                )}
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}