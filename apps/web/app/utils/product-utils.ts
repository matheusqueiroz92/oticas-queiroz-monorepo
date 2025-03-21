/**
 * Utilitários relacionados a produtos
 */
import { Product, Lens, CleanLens, PrescriptionFrame, SunglassesFrame } from "@/app/types/product";

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
 * Determina o tipo correto para um produto
 */
export function getCorrectType(product: any): Product['productType'] {
  if (!product || !product.name) {
    return product?.productType || 'lenses';
  }
  
  const productName = product.name.toLowerCase();
  
  // Verificar por correspondências específicas
  for (const [key, type] of Object.entries(PRODUCT_TYPES)) {
    if (productName.includes(key.toLowerCase())) {
      return type;
    }
  }
  
  // Se não encontrar por nome, verificar palavras-chave
  if (productName.includes('lente') || productName.includes('vision')) {
    return 'lenses';
  }
  if (productName.includes('sol') || productName.includes('ray-ban') || productName.includes('rayban')) {
    return 'sunglasses_frame';
  }
  if (productName.includes('armação') || productName.includes('frame')) {
    return 'prescription_frame';
  }
  if (productName.includes('limpa') || productName.includes('clean')) {
    return 'clean_lenses';
  }
  
  // Manter o tipo original se disponível
  return product.productType || 'lenses';
}

/**
 * Normaliza um produto para garantir que tenha preço e tipo corretos
 */
export function normalizeProduct(product: any): Product {
  if (!product) return {} as Product;
  
  // Primeiro determinamos o tipo correto
  const correctType = getCorrectType(product);
  const correctPrice = getCorrectPrice(product);
  
  // Base comum para qualquer tipo de produto
  const baseProduct = {
    ...product,
    sellPrice: correctPrice,
    productType: correctType
  };
  
  // Agora, dependendo do tipo correto, retornamos o objeto apropriado
  switch (correctType) {
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
      lenses: "Lentes",
      clean_lenses: "Limpa-lentes",
      prescription_frame: "Armação de grau",
      sunglasses_frame: "Armação solar"
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