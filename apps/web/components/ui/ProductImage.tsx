import { useState } from 'react';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export const ProductImage = ({
  src,
  alt,
  className = '',
  width,
  height,
}: ProductImageProps) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500">{alt || 'Imagem indisponível'}</span>
      </div>
    );
  }
  
  // Converter o caminho da imagem para usar o novo endpoint
  const imageUrl = src.startsWith('/images/') 
    ? `/api/image${src.substring(7)}`  // Remove /images e adiciona /api/image
    : src;
  
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={{ width, height }}
      onError={() => setError(true)}
    />
  );
};