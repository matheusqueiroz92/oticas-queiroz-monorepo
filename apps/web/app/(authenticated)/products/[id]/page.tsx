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
import { getProductTypeName } from "@/app/services/productService";
import { ProductImage } from "@/components/ui/ImageDisplay";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { canManageProducts } = usePermissions();

  const {
    currentProduct,
    loading,
    error,
    fetchProductById,
    navigateToEditProduct,
    formatCurrency,
  } = useProducts();

  useEffect(() => {
    if (id) {
      fetchProductById(id as string);
    }
  }, [id, fetchProductById]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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

  // Renderização condicional de detalhes baseada no tipo de produto
  const renderProductSpecificDetails = () => {
    switch (currentProduct.productType) {
      case 'lenses':
        return (
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Lente</p>
            <p className="font-medium">{currentProduct.lensType}</p>
          </div>
        );
      
      case 'prescription_frame':
        return (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Armação</p>
              <p className="font-medium">{currentProduct.typeFrame}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cor</p>
              <p className="font-medium">{currentProduct.color}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Formato</p>
              <p className="font-medium">{currentProduct.shape}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Referência</p>
              <p className="font-medium">{currentProduct.reference}</p>
            </div>
          </>
        );
      
      case 'sunglasses_frame':
        return (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Modelo</p>
              <p className="font-medium">{currentProduct.modelSunglasses}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Armação</p>
              <p className="font-medium">{currentProduct.typeFrame}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cor</p>
              <p className="font-medium">{currentProduct.color}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Formato</p>
              <p className="font-medium">{currentProduct.shape}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Referência</p>
              <p className="font-medium">{currentProduct.reference}</p>
            </div>
          </>
        );
      
      case 'clean_lenses':
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalhes do Produto</h1>
        <Badge variant="outline">
          {getProductTypeName(currentProduct.productType)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imagem do Produto */}
        <Card className="overflow-hidden">
          <div className="h-[300px] bg-gray-100 flex items-center justify-center">
            {currentProduct.image ? (
              <ProductImage 
                src={currentProduct.image} 
                alt={currentProduct.name} 
                className="rounded-md w-full h-48 object-cover" 
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
            {currentProduct.brand && (
              <div>
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-medium">{currentProduct.brand}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-muted-foreground">Preço de Venda</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(currentProduct.sellPrice)}
              </p>
            </div>
            
            {currentProduct.costPrice && (
              <div>
                <p className="text-sm text-muted-foreground">Preço de Custo</p>
                <p className="font-medium">{formatCurrency(currentProduct.costPrice)}</p>
              </div>
            )}

            {/* Detalhes específicos por tipo de produto */}
            {renderProductSpecificDetails()}

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