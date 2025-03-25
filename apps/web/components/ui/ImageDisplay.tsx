import { getImageUrl } from '@/app/utils/image-utils';
import Image from 'next/image';
import { useState } from 'react';

interface ImageDisplayProps {
  src: string | null | undefined;
  alt: string;
  type?: 'product' | 'user';
  className?: string;
  width?: number;
  height?: number;
  useNextImage?: boolean;
}

export const ImageDisplay = ({
  src,
  alt,
  type = 'product',
  className = '',
  width = 200,
  height = 200,
  useNextImage = false,
}: ImageDisplayProps) => {
  const [error, setError] = useState(false);
  const formattedSrc = error ? 
    (type === 'product' ? '/placeholders/product-placeholder.png' : '/placeholders/user-placeholder.png') : 
    getImageUrl(src, type);

  // Manipulador de erro para imagens
  const handleError = () => {
    setError(true);
  };

  // Usando o componente Image do Next.js para otimização (opcional)
  if (useNextImage) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={formattedSrc}
          alt={alt}
          width={width}
          height={height}
          className="object-cover"
          onError={handleError}
        />
      </div>
    );
  }

  // Usando a tag img padrão
  return (
    <img
      src={formattedSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
    />
  );
};

// Componentes específicos para produtos e usuários
export const ProductImage = (props: Omit<ImageDisplayProps, 'type'>) => (
  <ImageDisplay {...props} type="product" />
);

export const UserImage = (props: Omit<ImageDisplayProps, 'type'>) => (
  <ImageDisplay {...props} type="user" />
);