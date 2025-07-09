/**
 * Utilitários relacionados a produtos
 */
import { Product, Lens, CleanLens, PrescriptionFrame, SunglassesFrame } from "@/app/_types/product";
import { Package, SprayCan, Glasses, Sun, AlertTriangle, CircleX, View, Blocks, Package2 } from "lucide-react";
import React from "react";

// Mapa de preços conhecidos para produtos específicos
export const KNOWN_PRICES: { [key: string]: number } = {
  // Óculos Ray-Ban
  'Ray-ban': 549,
  'Ray-Ban': 549,
  'Óculos de sol Ray-ban': 549,
  'Óculos de sol Ray-Ban': 549,
  'Óculos de sol Ray-ban hexagonal': 549,
  
  // Lentes Transitions
  'Transitions': 800,
  'Lentes Transitions': 800,
  'Lentes transitions': 800,
  
  // Outros produtos comuns
  'Limpa Lentes': 30,
};

// Mapa de tipos corretos para produtos específicos
export const PRODUCT_TYPES: { [key: string]: "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame" } = {
  'Ray-ban': 'sunglasses_frame',
  'Ray-Ban': 'sunglasses_frame',
  'Óculos de sol': 'sunglasses_frame',
  'Transitions': 'lenses',
  'Lentes': 'lenses',
  'Limpa Lentes': 'clean_lenses',
};

/**
 * Determina o preço correto para um produto
 */
export function getCorrectPrice(product: any): number {
  // Se o produto tem um preço válido, use-o
  if (product && typeof product.sellPrice === 'number' && product.sellPrice > 0) {
    return product.sellPrice;
  }
  
  // Preço pelo nome exato
  if (product?.name && KNOWN_PRICES[product.name]) {
    return KNOWN_PRICES[product.name];
  }
  
  // Preço por correspondência parcial
  const productName = product?.name?.toLowerCase() || '';
  if (productName) {
    // Verificar correspondências específicas
    for (const [key, price] of Object.entries(KNOWN_PRICES)) {
      if (productName.includes(key.toLowerCase())) {
        return price;
      }
    }
    
    // Baseado em características específicas
    if (productName.includes('transitions')) {
      return 800;
    }
    if (productName.includes('ray-ban') || productName.includes('rayban') || productName.includes('sol')) {
      return 549;
    }
  }
  
  // Preço por tipo de produto
  if (product?.productType) {
    switch (product.productType) {
      case 'lenses': return 800;
      case 'sunglasses_frame': return 549;
      case 'prescription_frame': return 400;
      case 'clean_lenses': return 30;
      default: return 0;
    }
  }
  
  return 0;
}


/**
 * Normaliza um produto para garantir que tenha preço e tipo corretos
 */
export function normalizeProduct(product: any): Product {
  if (!product) return {} as Product;
  
  const correctPrice = getCorrectPrice(product);
  
  const baseProduct = {
    ...product,
    sellPrice: correctPrice,
  };
  
  // Agora, dependendo do tipo correto, retornamos o objeto apropriado
  switch (product.productType) {
    case 'lenses':
      return {
        ...baseProduct,
        productType: 'lenses',
        lensType: product.lensType || 'Padrão'
      } as Lens;
      
    case 'clean_lenses':
      return {
        ...baseProduct,
        productType: 'clean_lenses'
      } as CleanLens;
      
    case 'prescription_frame':
      return {
        ...baseProduct,
        productType: 'prescription_frame',
        typeFrame: product.typeFrame || 'Padrão',
        color: product.color || 'Padrão',
        shape: product.shape || 'Padrão',
        reference: product.reference || 'Padrão'
      } as PrescriptionFrame;
      
    case 'sunglasses_frame':
      return {
        ...baseProduct,
        productType: 'sunglasses_frame',
        modelSunglasses: product.modelSunglasses || product.model || 'Padrão',
        typeFrame: product.typeFrame || 'Padrão',
        color: product.color || 'Padrão',
        shape: product.shape || 'Padrão',
        reference: product.reference || 'Padrão'
      } as SunglassesFrame;
      
    default:
      // Se por algum motivo não conseguirmos determinar o tipo,
      // retornamos como lentes (mais seguro)
      return {
        ...baseProduct,
        productType: 'lenses',
        lensType: product.lensType || 'Padrão'
      } as Lens;
  }
}

/**
 * Normaliza um array de produtos
 */
export function normalizeProducts(products: any[] | any): Product[] {
  // Se não for um array, converter para array com um único item
  if (!Array.isArray(products)) {
    return [normalizeProduct(products)];
  }

  // Normalizar cada item do array
  return products.map(product => normalizeProduct(product));
}

/**
 * Retorna o rótulo (label) em português para um tipo de produto
 * @param type Tipo do produto recebido da API
 * @returns String com o nome do tipo em português
 */
export function getProductTypeLabel(type?: string): string {
    // Mapeia os tipos de produto do backend para labels amigáveis em português
    const productTypes: Record<string, string> = {
      'lenses': 'Lentes',
      'prescription_frame': 'Armação de Grau',
      'sunglasses': 'Armação Solar',
      'sunglasses_frame': 'Armação Solar',
      'frame': 'Armação',
      'contact_lenses': 'Lentes de Contato',
      'accessories': 'Acessórios',
      'cleaning_products': 'Limpa-lentes',
      'clean_lenses': 'Limpa-lentes',
      'cases': 'Estojo',
      'others': 'Outros'
    };
    
    // Se não houver tipo definido ou o tipo não estiver no mapa, retorna valor padrão
    if (!type || !productTypes[type]) {
      return "Tipo não especificado";
    }
    
    return productTypes[type];
  }
  
  /**
   * Verifica se um produto é uma armação (grau ou solar)
   * @param type Tipo do produto
   * @returns Boolean indicando se é uma armação
   */
  export function isFrame(type?: string): boolean {
    return type === "prescription_frame" || type === "sunglasses_frame";
  }
  
  /**
   * Verifica se um produto é lente
   * @param type Tipo do produto
   * @returns Boolean indicando se é uma lente
   */
  export function isLens(type?: string): boolean {
    return type === "lenses";
  }
  
  /**
   * Verifica se um produto é limpa-lentes
   * @param type Tipo do produto
   * @returns Boolean indicando se é um limpa-lentes
   */
  export function isCleanLens(type?: string): boolean {
    return type === "clean_lenses";
  }
  
  /**
   * Retorna um array com todos os tipos de produtos disponíveis
   * @returns Array com os tipos de produtos
   */
  export function getAllProductTypes(): string[] {
    return ["lenses", "clean_lenses", "prescription_frame", "sunglasses_frame"];
  }
  
  /**
   * Agrupa produtos por tipo
   * @param products Array de produtos
   * @returns Objeto com produtos agrupados por tipo
   */
  export function groupProductsByType(products: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {
      lenses: [],
      clean_lenses: [],
      prescription_frame: [],
      sunglasses_frame: [],
      other: []
    };
    
    products.forEach(product => {
      const type = product.productType || 'other';
      if (grouped[type]) {
        grouped[type].push(product);
      } else {
        grouped.other.push(product);
      }
    });
    
    return grouped;
  }

  export const checkForLenses = (products: Product[]) => {
    return products.some(product => product.productType === 'lenses');
  };


export const getProductTypeName = (type: string): string => {
  const typeNames = {
    lenses: "Lentes",
    clean_lenses: "Lentes de Limpeza",
    prescription_frame: "Armação de Grau",
    sunglasses_frame: "Armação de Sol"
  };
  return typeNames[type as keyof typeof typeNames] || type;
};

export const getProductTypeIcon = (type: string): React.ReactNode => {
  const typeIcons = {
    lenses: React.createElement(Glasses),
    clean_lenses: React.createElement(SprayCan),
    prescription_frame: React.createElement(Glasses),
    sunglasses_frame: React.createElement(Sun)
  };
  return typeIcons[type as keyof typeof typeIcons] || React.createElement(Package);
};

export const getProductTypeBadge = (type: string) => {
  const configs = {
    lenses: { 
      label: "Lentes", 
      className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700" 
    },
    clean_lenses: { 
      label: "Lentes de Limpeza", 
      className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700" 
    },
    prescription_frame: { 
      label: "Armação de Grau", 
      className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700" 
    },
    sunglasses_frame: { 
      label: "Armação de Sol", 
      className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700" 
    }
  };
  return configs[type as keyof typeof configs] || { 
    label: type, 
    className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600" 
  };
};

export const getStockStatusInfo = (product: any) => {
  if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
    return null;
  }
  
  const stock = product.stock || 0;
  
  if (stock === 0) {
    return { 
      label: "Sem estoque", 
      className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
      color: "red"
    };
  } else if (stock <= 5) {
    return { 
      label: `${stock} unidades - Estoque baixo`, 
      className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
      color: "yellow"
    };
  }
  
  return { 
    label: `${stock} unidades em estoque`, 
    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    color: "green"
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const getProductImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${baseUrl}${imagePath}`;
};

export const getStockFilterOptions = () => [
  { value: "all", label: "Estoque", icon: React.createElement(Package2, { size: 16 }) },
  { value: "low", label: "Estoque baixo", icon: React.createElement(AlertTriangle, { size: 16 }) },
  { value: "out", label: "Sem estoque", icon: React.createElement(CircleX, { size: 16 }) }
];

export const getProductTypeFilterOptions = () => [
  { value: "all", label: "Todos os tipos", icon: React.createElement(Blocks, { size: 16 }) },
  { value: "lenses", label: "Lentes", icon: React.createElement(View, { size: 16 }) },
  { value: "clean_lenses", label: "Limpa-lentes", icon: React.createElement(SprayCan, { size: 16 }) },
  { value: "prescription_frame", label: "Armação de Grau", icon: React.createElement(Glasses, { size: 16 }) },
  { value: "sunglasses_frame", label: "Armação de Sol", icon: React.createElement(Sun, { size: 16 }) }
];

  /**
 * Busca um produto com detalhes consistentes
 */
// const fetchProductWithConsistentDetails = async (id: string): Promise<Product | null> => {
//   try {
//     const product = await getProductById(id);
//     if (!product) return null;
    
//     // Usamos as-any como intermediário para evitar erros de tipo
//     return normalizeProduct(product as any);
//   } catch (error) {
//     console.error("Erro ao buscar produto:", error);
//     return null;
//   }
// };