/**
 * Utilitários relacionados a produtos
 */

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