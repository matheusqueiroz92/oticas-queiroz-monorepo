import React, { useState, useEffect } from 'react';

interface ProductImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function ProductImage({ src, alt, className = '', width, height }: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState('');
  const [error, setError] = useState(false);
  
  useEffect(() => {
    if (!src) return;
    
    // Lógica para determinar a URL correta
    if (src.startsWith('/images/')) {
      // Em desenvolvimento, tente localhost se em ambiente seguro
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        setImageSrc(`http://localhost:3333${src}`);
      } else {
        // Em produção, use o caminho completo
        setImageSrc(`https://app.oticasqueiroz.com.br/api/serve-image?path=${src.replace('/images/', '')}`);
      }
    } else {
      setImageSrc(src);
    }
  }, [src]);
  
  if (!src || error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ 
          width: width || 200, 
          height: height || 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center' 
        }}
      >
        <span className="text-gray-500">{alt || 'Imagem indisponível'}</span>
      </div>
    );
  }
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{ width, height, objectFit: 'cover' }}
      onError={() => setError(true)}
    />
  );
}