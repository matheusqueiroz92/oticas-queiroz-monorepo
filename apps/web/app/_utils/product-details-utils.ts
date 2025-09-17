import { XCircle, AlertTriangle, CheckCircle } from "lucide-react";

export const getProductTypeBadgeConfig = (type: string) => {
  const configs = {
    lenses: { label: "Lentes", className: "bg-blue-100 text-blue-800" },
    clean_lenses: { label: "Lentes de Limpeza", className: "bg-green-100 text-green-800" },
    prescription_frame: { label: "Armação de Grau", className: "bg-purple-100 text-purple-800" },
    sunglasses_frame: { label: "Armação de Sol", className: "bg-orange-100 text-orange-800" }
  };
  return configs[type as keyof typeof configs] || { label: type, className: "bg-gray-100 text-gray-800" };
};

export const getStockStatusConfig = (product: any) => {
  if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
    return null;
  }
  
  const stock = (product as any).stock || 0;
  if (stock === 0) {
    return { 
      label: "Sem estoque", 
      icon: XCircle, 
      className: "bg-red-50 text-red-700 border-red-200" 
    };
  } else if (stock <= 5) {
    return { 
      label: `${stock} unidades - Estoque baixo`, 
      icon: AlertTriangle, 
      className: "bg-yellow-50 text-yellow-700 border-yellow-200" 
    };
  }
  return { 
    label: `${stock} unidades em estoque`, 
    icon: CheckCircle, 
    className: "bg-green-50 text-green-700 border-green-200" 
  };
};

export const buildProductImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  return `${baseUrl}${imagePath}`;
};

export const formatProductDate = (date: string | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

export const getProductSpecifications = (product: any) => {
  const specifications = [];

  // Type-specific fields
  if (product.productType === 'lenses' && 'lensType' in product) {
    specifications.push({
      label: 'Tipo de Lente',
      value: product.lensType,
      icon: 'Eye'
    });
  }

  if ((product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') && 'color' in product) {
    specifications.push({
      label: 'Cor',
      value: product.color,
      icon: 'Palette'
    });
  }

  if ((product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') && 'shape' in product) {
    specifications.push({
      label: 'Formato',
      value: product.shape,
      icon: 'Hash'
    });
  }

  if ((product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame') && 'reference' in product) {
    specifications.push({
      label: 'Referência',
      value: product.reference,
      icon: 'ScanBarcode'
    });
  }

  if (product.productType === 'sunglasses_frame' && 'modelSunglasses' in product) {
    specifications.push({
      label: 'Modelo',
      value: product.modelSunglasses,
      icon: 'Star'
    });
  }

  // Created date
  specifications.push({
    label: 'Cadastrado em',
    value: formatProductDate(product.createdAt),
    icon: 'Calendar'
  });

  return specifications;
}; 