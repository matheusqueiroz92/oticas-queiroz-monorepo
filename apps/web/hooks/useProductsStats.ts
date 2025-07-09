import { useMemo } from 'react';

export function useProductsStats(products: any[]) {
  const stats = useMemo(() => {
    const totalProducts = products.length;
    
    // Produtos com estoque baixo (apenas para frames)
    const lowStockProducts = products.filter(product => {
      if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
        return false;
      }
      const stock = (product as any).stock || 0;
      return stock > 0 && stock <= 5;
    }).length;
    
    // Produtos sem estoque (apenas para frames)
    const outOfStockProducts = products.filter(product => {
      if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
        return false;
      }
      const stock = (product as any).stock || 0;
      return stock === 0;
    }).length;
    
    // Produtos por tipo
    const productsByType = products.reduce((acc, product) => {
      acc[product.productType] = (acc[product.productType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Valor total do estoque
    const totalStockValue = products.reduce((acc, product) => {
      if (product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') {
        const stock = (product as any).stock || 0;
        const price = product.sellPrice || 0;
        return acc + (stock * price);
      }
      return acc;
    }, 0);
    
    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      productsByType,
      totalStockValue,
      lensesCount: productsByType.lenses || 0,
      cleanLensesCount: productsByType.clean_lenses || 0,
      prescriptionFramesCount: productsByType.prescription_frame || 0,
      sunglassesFramesCount: productsByType.sunglasses_frame || 0,
    };
  }, [products]);

  return stats;
} 