"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImageUrl } from "@/app/utils/image-utils";

export default function ImageDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testImagePath, setTestImagePath] = useState("/images/products/test.jpg");

  // Caminhos de teste para verificar
  const testCases = [
    { path: null, description: "Caminho nulo (deve mostrar placeholder)" },
    { path: "/images/products/test.jpg", description: "Caminho com /images" },
    { path: "test.jpg", description: "Apenas nome do arquivo" },
    { path: "http://example.com/test.jpg", description: "URL completa" },
  ];

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        // Tente acessar a rota de diagnóstico que criamos no backend
        const response = await fetch("/api/debug/images-path");
        const data = await response.json();
        setDebugInfo(data);
      } catch (error) {
        console.error("Erro ao buscar informações de depuração:", error);
        setDebugInfo({ error: String(error) });
      } finally {
        setLoading(false);
      }
    }

    fetchDebugInfo();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Depuração de Imagens</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Ambiente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Ambiente:</strong> {process.env.NODE_ENV}</p>
            <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Não definida'}</p>
            <p><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.host : 'SSR'}</p>
            <p><strong>Base URL:</strong> {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Teste de Caminhos de Imagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testCases.map((test, index) => (
              <div key={index} className="p-4 border rounded">
                <p className="mb-2"><strong>Descrição:</strong> {test.description}</p>
                <p className="mb-2"><strong>Caminho original:</strong> {test.path || 'null'}</p>
                <p className="mb-2"><strong>URL formatada:</strong> {getImageUrl(test.path, 'product')}</p>
                <div className="h-20 w-full bg-gray-100 flex items-center justify-center">
                  <img 
                    src={getImageUrl(test.path, 'product')} 
                    alt="Teste" 
                    className="h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholders/product-placeholder.png';
                      e.currentTarget.style.border = '2px solid red';
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Servidor</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando informações do servidor...</p>
          ) : (
            <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-80">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Imagem Específica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4 items-center">
              <input
                type="text"
                value={testImagePath}
                onChange={(e) => setTestImagePath(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="Caminho da imagem para testar"
              />
              <button 
                onClick={() => {
                  // Força uma nova renderização
                  setTestImagePath(prev => prev + "?t=" + Date.now());
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Testar
              </button>
            </div>
            
            <div className="p-4 border rounded">
              <p className="mb-2"><strong>Caminho de teste:</strong> {testImagePath}</p>
              <p className="mb-2"><strong>URL formatada:</strong> {getImageUrl(testImagePath, 'product')}</p>
              <div className="h-40 w-full bg-gray-100 flex items-center justify-center">
                <img 
                  src={getImageUrl(testImagePath, 'product')} 
                  alt="Imagem de teste específica" 
                  className="h-full object-contain"
                  onError={(e) => {
                    console.error("Erro ao carregar imagem:", e);
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholders/product-placeholder.png';
                    e.currentTarget.style.border = '2px solid red';
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}