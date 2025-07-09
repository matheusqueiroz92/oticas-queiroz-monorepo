"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useProductById } from "@/hooks/useProductById";
import { useProductDetailsState } from "@/hooks/useProductDetailsState";
import { useProductDetailsData } from "@/hooks/useProductDetailsData";
import { ProductDetailsContent } from "@/components/products/ProductDetailsContent";
import { ProductDetailsLoading } from "@/components/products/ProductDetailsLoading";
import { ProductDetailsError } from "@/components/products/ProductDetailsError";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { showEditDialog, handleOpenEditDialog, handleCloseEditDialog } = useProductDetailsState();
  
  const { product, loading, error, fetchProduct } = useProductById(id);

  const { handleGoBack, handleEditSuccess } = useProductDetailsData({
    productId: id,
    fetchProductById: fetchProduct,
  });

  useEffect(() => {
    if (id) {
      fetchProduct(id as string);
    }
  }, [id, fetchProduct]);

  if (loading) {
    return <ProductDetailsLoading />;
  }

  if (error || !product) {
    return (
      <ProductDetailsError 
        error={error} 
        onGoBack={handleGoBack} 
      />
    );
  }

  return (
    <ProductDetailsContent
      product={product}
      showEditDialog={showEditDialog}
      onGoBack={handleGoBack}
      onEditClick={handleOpenEditDialog}
      onCloseEditDialog={handleCloseEditDialog}
      onEditSuccess={() => {
        handleEditSuccess();
        handleCloseEditDialog();
      }}
    />
  );
}