"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { getProductTypeName } from "@/app/services/productService";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [productType, setProductType] = useState("all");

  const {
    products,
    loading,
    error,
    totalPages,
    updateFilters,
    currentPage,
    setCurrentPage,
    navigateToProductDetails,
    navigateToCreateProduct,
    formatCurrency,
  } = useProducts();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const handleProductTypeChange = (value: string) => {
    setProductType(value);
    updateFilters({ 
      productType: value !== "all" ? value as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame" : undefined 
    });
  };

  if (error) {
    return (
      <div className="p-8">
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </form>
            <Select value={productType} onValueChange={handleProductTypeChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="lenses">Lentes</SelectItem>
                <SelectItem value="clean_lenses">Limpa-lentes</SelectItem>
                <SelectItem value="prescription_frame">Armação de Grau</SelectItem>
                <SelectItem value="sunglasses_frame">Armação Solar</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={navigateToCreateProduct}>Novo Produto</Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card key={product._id} className="overflow-hidden">
                  <div className="aspect-square relative bg-muted">
                    {product.image ? (
                      <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${product.image}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {product.brand} - {getProductTypeName(product.productType)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        {formatCurrency(product.sellPrice)}
                      </span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => navigateToProductDetails(product._id)}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}