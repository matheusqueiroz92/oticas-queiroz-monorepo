"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProducts } from "@/hooks/useProducts";
import { usePermissions } from "@/hooks/usePermissions";
import { ProductDetails } from "@/components/Products/ProductDetails";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { canManageProducts } = usePermissions();
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  
  const {
    currentProduct,
    loading,
    error,
    fetchProductById,
    navigateToEditProduct,
    handleUpdateStock,
    formatCurrency,
  } = useProducts();

  useEffect(() => {
    if (id) {
      fetchProductById(id as string);
    }
  }, [id, fetchProductById]);

  const handleGoBack = () => {
    router.push("/products");
  };

  const handleEditProduct = () => {
    if (currentProduct) {
      navigateToEditProduct(currentProduct._id);
    }
  };

  const handleStockUpdate = async (newStock: number) => {
    if (!currentProduct) return;
    
    setIsUpdatingStock(true);
    try {
      await handleUpdateStock(currentProduct._id, newStock);
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
    } finally {
      setIsUpdatingStock(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error?.message || "Produto não encontrado"} 
          </AlertDescription>
          <Button className="mt-4" onClick={handleGoBack}>
            Voltar para Produtos
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Detalhes do Produto</h1>
      </div>

      <ProductDetails
        product={currentProduct}
        formatCurrency={formatCurrency}
        isUpdatingStock={isUpdatingStock}
        onStockUpdate={handleStockUpdate}
        onEdit={handleEditProduct}
        showDeleteOption={false}
      />
      
      <div className="mt-4">
        <Button onClick={handleEditProduct} className="bg-[var(--primary-blue)]">
          Editar
        </Button>
      </div>
    </div>
  );
}