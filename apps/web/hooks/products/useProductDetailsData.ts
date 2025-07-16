import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseProductDetailsDataProps {
  productId: string;
  fetchProductById: (id: string) => void;
}

export function useProductDetailsData({ productId, fetchProductById }: UseProductDetailsDataProps) {
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    router.push("/products");
  }, [router]);

  const handleEditSuccess = useCallback(() => {
    if (productId) {
      fetchProductById(productId);
    }
  }, [productId, fetchProductById]);

  const handleRefreshProduct = useCallback(() => {
    if (productId) {
      fetchProductById(productId);
    }
  }, [productId, fetchProductById]);

  return {
    handleGoBack,
    handleEditSuccess,
    handleRefreshProduct,
  };
} 