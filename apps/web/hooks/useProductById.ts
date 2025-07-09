import { useState, useEffect, useCallback } from 'react';
import { getProductById } from '@/app/_services/productService';
import { Product } from '@/app/_types/product';

export function useProductById(id?: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchProduct = useCallback(async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductById(productId);
      setProduct(data);
    } catch (err) {
      setError(err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id, fetchProduct]);

  return { product, loading, error, fetchProduct };
} 