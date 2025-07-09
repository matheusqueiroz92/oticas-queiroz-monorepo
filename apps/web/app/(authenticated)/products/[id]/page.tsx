"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { useProductDetailsState } from "@/hooks/useProductDetailsState";
import { useProductDetailsData } from "@/hooks/useProductDetailsData";
import { ProductDetailsContent } from "@/components/products/ProductDetailsContent";
import { ProductDetailsLoading } from "@/components/products/ProductDetailsLoading";
import { ProductDetailsError } from "@/components/products/ProductDetailsError";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { showEditDialog, handleOpenEditDialog, handleCloseEditDialog } = useProductDetailsState();
  
  const {
    currentProduct,
    loading,
    error,
    fetchProductById,
  } = useProducts(1, "", "all");

  const { handleGoBack, handleEditSuccess } = useProductDetailsData({
    productId: id,
    fetchProductById,
  });

  useEffect(() => {
    if (id) {
      fetchProductById(id as string);
    }
  }, [id, fetchProductById]);

  if (loading) {
    return <ProductDetailsLoading />;
  }

  if (error || !currentProduct) {
    return (
      <ProductDetailsError 
        error={error} 
        onGoBack={handleGoBack} 
      />
    );
  }

  return (
    <ProductDetailsContent
      product={currentProduct}
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