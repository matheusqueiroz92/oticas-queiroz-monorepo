import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Product } from "../../../app/types/product";

interface ProductSearchProps {
  products: Product[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  form: any;
  onProductAdd: (product: Product) => void;
}

export default function ProductSearch({
  products,
  form,
  onProductAdd,
}: ProductSearchProps) {
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setFilteredProducts([]);
      return;
    }

    const searchLower = productSearch.toLowerCase();
    const filtered = products.filter((product) =>
      product.name?.toLowerCase().includes(searchLower)
    );
    setFilteredProducts(filtered);
  }, [productSearch, products]);

  const handleAddProduct = (product: Product | null) => {
    let newProduct: Product;

    if (product) {
      // Produto existente selecionado
      newProduct = {
        _id: product._id,
        name: product.name,
        category: product.category,
        description: product.description,
        image: product.image,
        brand: product.brand,
        modelGlasses: product.modelGlasses,
        price: product.price,
        stock: product.stock,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } else {
      // Produto personalizado com ID único
      newProduct = {
        _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: productSearch,
        category: "",
        description: "",
        image: "",
        brand: "",
        modelGlasses: "",
        price: 0,
        stock: 1,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
      };
    }

    onProductAdd(newProduct);
    setProductSearch("");
    setFilteredProducts([]);
  };

  return (
    <FormField
      control={form.control}
      name="products"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Produtos</FormLabel>
          <div className="relative">
            <Input
              placeholder="Digite o nome do produto"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            {productSearch && (
              <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
                <ul className="py-1">
                  {filteredProducts.map((product) => (
                    <li key={product._id} className="p-0">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer"
                        onClick={() => handleAddProduct(product)}
                        aria-label={`Adicionar produto ${product.name}`}
                      >
                        {product.name} - R$ {product.price.toFixed(2)}
                      </button>
                    </li>
                  ))}
                  {productSearch && (
                    <li className="p-0">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer text-blue-600"
                        onClick={() => handleAddProduct(null)}
                        aria-label={`Adicionar produto personalizado: ${productSearch}`}
                      >
                        + Adicionar produto personalizado: "{productSearch}"
                      </button>
                    </li>
                  )}
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
