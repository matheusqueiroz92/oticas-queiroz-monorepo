/**
 * Formata URLs de imagem corretamente para acessar imagens servidas pelo backend
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
  
  // A URL base do backend que serve as imagens
  // Deve apontar para o host onde o backend está rodando
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  
  // Se o caminho já começa com /images, apenas adicione a base
  if (imagePath.startsWith('/images/')) {
    return `${backendBaseUrl}${imagePath}`;
  }
  
  // Garanta que o caminho comece com /
  if (!imagePath.startsWith('/')) {
    imagePath = `/${imagePath}`;
  }
  
  // Combine a URL base com o caminho da imagem
  return `${backendBaseUrl}/images${imagePath}`;
}