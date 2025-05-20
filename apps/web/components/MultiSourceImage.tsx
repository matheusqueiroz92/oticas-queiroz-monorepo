import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

interface MultiSourceImageProps {
  imagePath: string | null | undefined;
  alt: string;
  className?: string;
  type?: 'product' | 'user';
}

export function MultiSourceImage({
  imagePath,
  alt,
  className = '',
  type = 'product'
}: MultiSourceImageProps) {
  const [workingUrl, setWorkingUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imagePath) {
      setIsLoading(false);
      return;
    }

    // Reset state quando o caminho muda
    setWorkingUrl(null);
    setIsLoading(true);

    // Diferentes formas de construir a URL da imagem
    const generateUrls = () => {
      const urls: string[] = [];
      
      // URL base vinda da variável de ambiente
      const envBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      // URL base construída a partir do hostname atual
      const dynamicBaseUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}`
        : '';
      
      // Se já for uma URL completa
      if (imagePath.startsWith('http')) {
        urls.push(imagePath);
      }
      
      // Variações com URL base da variável de ambiente
      if (envBaseUrl) {
        if (imagePath.startsWith('/images/')) {
          urls.push(`${envBaseUrl}${imagePath}`);
        } else if (imagePath.startsWith('/')) {
          urls.push(`${envBaseUrl}/images${imagePath}`);
          urls.push(`${envBaseUrl}${imagePath}`);
        } else {
          urls.push(`${envBaseUrl}/images/${type}s/${imagePath}`);
          urls.push(`${envBaseUrl}/images/${imagePath}`);
        }
      }
      
      // Variações com URL base dinâmica (hostname atual)
      if (dynamicBaseUrl) {
        if (imagePath.startsWith('/images/')) {
          urls.push(`${dynamicBaseUrl}${imagePath}`);
        } else if (imagePath.startsWith('/')) {
          urls.push(`${dynamicBaseUrl}/images${imagePath}`);
          urls.push(`${dynamicBaseUrl}${imagePath}`);
        } else {
          urls.push(`${dynamicBaseUrl}/images/${type}s/${imagePath}`);
          urls.push(`${dynamicBaseUrl}/images/${imagePath}`);
        }
      }
      
      // Caminhos relativos
      if (imagePath.startsWith('/images/')) {
        urls.push(imagePath);
      } else if (imagePath.startsWith('/')) {
        urls.push(`/images${imagePath}`);
      } else {
        urls.push(`/images/${type}s/${imagePath}`);
      }
      
      // Remover duplicatas
      return Array.from(new Set(urls));
    };

    const urlsToTry = generateUrls();

    // Função para verificar se uma URL existe
    const checkImageUrl = (url: string): Promise<string | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    // Testar todas as URLs em sequência
    async function testAllUrls() {
      for (const url of urlsToTry) {
        const result = await checkImageUrl(url);
        if (result) {
          setWorkingUrl(result);
          setIsLoading(false);
          return;
        }
      }
      
      // Nenhuma URL funcionou
      setIsLoading(false);
    }

    testAllUrls();
  }, [imagePath, type]);

  // Imagem de fallback
  const fallbackImage = type === 'product' 
    ? '/placeholders/product-placeholder.png' 
    : '/placeholders/user-placeholder.png';

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="animate-pulse bg-gray-200 w-full h-full"></div>
      </div>
    );
  }

  if (!workingUrl) {
    // Nenhuma URL funcionou, usar fallback
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 ${className}`}>
        <Package className="h-12 w-12 text-gray-400 opacity-20" />
      </div>
    );
  }

  return (
    <img
      src={workingUrl}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = fallbackImage;
      }}
    />
  );
}