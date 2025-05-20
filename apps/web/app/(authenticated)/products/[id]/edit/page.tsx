"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/useToast";
import { ProductEditForm } from "@/components/Products/ProductEditForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentProduct,
    loading,
    fetchProductById,
    handleUpdateProduct,
  } = useProducts();

  useEffect(() => {
    if (id) {
      fetchProductById(id as string);
    }
  }, [id, fetchProductById]);

  const handleGoBack = () => {
    router.push("/products");
  };

  const handleSubmit = async (data: any) => {
    if (!id || !currentProduct) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
  
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("sellPrice", String(data.sellPrice));
      
      if (data.brand) formData.append("brand", data.brand);
      if (data.costPrice !== undefined) formData.append("costPrice", String(data.costPrice));
  
      if (currentProduct.productType === "lenses") {
        formData.append("lensType", data.lensType);
      } else if (currentProduct.productType === "prescription_frame" || currentProduct.productType === "sunglasses_frame") {
        formData.append("typeFrame", data.typeFrame);
        formData.append("color", data.color);
        formData.append("shape", data.shape);
        formData.append("reference", data.reference);
        
        // Modificação importante: Certifique-se de que o estoque seja enviado como string
        // E seja incluído mesmo que seja zero
        formData.append("stock", String(data.stock || 0));
        
        if (currentProduct.productType === "sunglasses_frame") {
          formData.append("modelSunglasses", data.modelSunglasses);
        }
      }
  
      const file = data.image instanceof File ? data.image : null;
      if (file) {
        formData.append("productImage", file);
      }
  
      const updatedProduct = await handleUpdateProduct(id as string, formData);
      if (updatedProduct) {
        toast({
          title: "Produto atualizado com sucesso",
          description: "As alterações foram salvas."
        });
        router.push(`/products/${id}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar produto",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar as alterações."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Editar Produto</h1>
      </div>

      <ProductEditForm
        product={currentProduct}
        loading={loading}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={handleGoBack}
      />
    </div>
  );
}