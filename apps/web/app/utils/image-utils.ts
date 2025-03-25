/**
 * Formata URLs de imagem para serem exibidas corretamente
 * @param imagePath Caminho da imagem
 * @param type Tipo de imagem ('product' ou 'user')
 * @returns URL formatada corretamente
 */
export const getImageUrl = (
    imagePath: string | undefined | null,
    type: 'product' | 'user' = 'product'
  ): string => {
    // Imagem padrão baseada no tipo
    const defaultImage = type === 'product' 
      ? '/placeholders/product-placeholder.png' 
      : '/placeholders/user-placeholder.png';
    
    // Se não houver caminho, retorna imagem padrão
    if (!imagePath) return defaultImage;
    
    // Se já for uma URL completa, retorna como está
    if (imagePath.startsWith('http')) return imagePath;
    
    // Corrige caminhos que contêm localhost
    if (imagePath.includes('localhost:3333')) {
      return imagePath.replace('http://localhost:3333', 'https://app.oticasqueiroz.com.br');
    }
    
    // Se for um caminho relativo, adiciona a URL base do site
    if (imagePath.startsWith('/images')) {
      return `https://app.oticasqueiroz.com.br${imagePath}`;
    }
    
    // Caso contrário, retorna o caminho como está
    return imagePath;
  };