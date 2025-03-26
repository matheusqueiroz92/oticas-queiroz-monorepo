import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construir o caminho para a imagem
    const imagePath = params.path.join('/');
    const fullPath = path.join('/var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo/apps/public/images', imagePath);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(fullPath)) {
      console.error(`Image not found: ${fullPath}`);
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Ler o arquivo
    const imageBuffer = fs.readFileSync(fullPath);
    
    // Determinar o tipo MIME
    const extension = path.extname(fullPath).toLowerCase();
    let mimeType = 'image/jpeg'; // padrão
    
    if (extension === '.png') mimeType = 'image/png';
    else if (extension === '.webp') mimeType = 'image/webp';
    else if (extension === '.gif') mimeType = 'image/gif';
    
    // Retornar a imagem
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=2592000',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image', { status: 500 });
  }
}