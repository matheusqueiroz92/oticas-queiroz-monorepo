"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useProducts } from "@/hooks/useProducts";
import { usePermissions } from "@/hooks/usePermissions";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { canManageProducts } = usePermissions();

  const {
    currentProduct, // Dados do produto atual
    loading, // Estado de carregamento
    error, // Erro, se houver
    fetchProductById, // Função para buscar o produto por ID
    navigateToEditProduct, // Função para navegar para a página de edição
    formatCurrency, // Função para formatar moeda
  } = useProducts();

  // Dispara a busca do produto quando o ID muda
  useEffect(() => {
    if (id) {
      fetchProductById(id as string);
    }
  }, [id, fetchProductById]);

  // Exibe um spinner enquanto os dados estão sendo carregados
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Exibe uma mensagem de erro se houver um erro ou se o produto não for encontrado
  if (error || !currentProduct) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error?.message || "Produto não encontrado"}
        <Button className="mt-4" onClick={() => router.push("/products")}>
          Voltar para Produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalhes do Produto</h1>
        <Badge variant="outline">
          {currentProduct.category === "solar"
            ? "Óculos de Sol"
            : "Óculos de Grau"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imagem do Produto */}
        <Card className="overflow-hidden">
          <div className="h-[300px] bg-gray-100 flex items-center justify-center">
            {currentProduct.image ? (
              <img
                src={`http://localhost:3333${currentProduct.image}`}
                alt={currentProduct.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-gray-400">Sem imagem disponível</div>
            )}
          </div>
        </Card>

        {/* Informações do Produto */}
        <Card>
          <CardHeader>
            <CardTitle>{currentProduct.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Marca</p>
              <p className="font-medium">{currentProduct.brand}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modelo</p>
              <p className="font-medium">{currentProduct.modelGlasses}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Preço</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(currentProduct.price)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estoque</p>
              <p className="font-medium">{currentProduct.stock} unidades</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="mt-1">{currentProduct.description}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Button variant="outline" onClick={() => router.push("/products")}>
              Voltar
            </Button>
            {canManageProducts && (
              <Button onClick={() => navigateToEditProduct(currentProduct._id)}>
                Editar Produto
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
