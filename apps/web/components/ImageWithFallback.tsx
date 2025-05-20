import React, { useState } from 'react';
import { getImageUrl } from '@/app/utils/image-utils';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | undefined;
  alt: string;
  fallbackSrc?: string;
  type?: 'product' | 'user';
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  type = 'product',
  className,
  ...rest
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  
  // Determinar a URL da imagem usando nossa função utilitária
  const imageUrl = getImageUrl(src, type);
  
  // Usar fallbackSrc passado ou determinar o padrão com base no tipo
  const defaultFallback = type === 'product' 
    ? '/placeholders/product-placeholder.png' 
    : '/placeholders/user-placeholder.png';
  
  const fallbackUrl = error ? (fallbackSrc || defaultFallback) : imageUrl;
  
  return (
    <img
      src={fallbackUrl}
      alt={alt}
      className={className}
      onError={() => {
        if (!error) setError(true);
      }}
      {...rest}
    />
  );
}