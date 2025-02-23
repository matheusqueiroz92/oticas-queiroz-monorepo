"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../../services/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", page, searchTerm, category],
    queryFn: () => fetchProducts(page, 10, searchTerm),
  });

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1); // Reset page when searching
  };

  if (isError) {
    return (
      <div className="p-8">
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Erro ao carregar produtos. Tente novamente mais tarde.
            </p>
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
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="solar">Óculos de Sol</SelectItem>
                <SelectItem value="grau">Óculos de Grau</SelectItem>
                <SelectItem value="infantil">Infantil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.products.map((product) => (
                <Card key={product._id} className="overflow-hidden">
                  <div className="aspect-square relative bg-muted">
                    {product.image ? (
                      <img
                        src={`http://localhost:3333${product.image}`} // Use o caminho da imagem como src
                        alt={product.name} // Texto alternativo para acessibilidade
                        className="w-full h-full object-cover" // Estilos para a imagem
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
                      {product.brand} - {product.modelGlasses}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Estoque: {product.stock}
                      </span>
                    </div>
                    <Button className="w-full mt-4">Ver Detalhes</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
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
