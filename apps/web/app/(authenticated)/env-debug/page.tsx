"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EnvDebugPage() {
  const [hostInfo, setHostInfo] = useState({
    hostname: "",
    protocol: "",
    fullUrl: ""
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostInfo({
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        fullUrl: `${window.location.protocol}//${window.location.host}`
      });
    }
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Ambiente</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Variáveis de Ambiente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
            <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || "Não definido"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Navegador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Hostname:</strong> {hostInfo.hostname}</p>
            <p><strong>Protocolo:</strong> {hostInfo.protocol}</p>
            <p><strong>URL Completa:</strong> {hostInfo.fullUrl}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Teste de URL de Imagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="mb-2"><strong>URL do backend via env:</strong> {process.env.NEXT_PUBLIC_API_URL || "Não definido"}</p>
              <p className="mb-2"><strong>URL construída para imagem (via env):</strong> {`${process.env.NEXT_PUBLIC_API_URL || ""}` + "/images/products/test.jpg"}</p>
            </div>
            
            <div>
              <p className="mb-2"><strong>URL construída para imagem (via hostname):</strong> {`${hostInfo.protocol}//${hostInfo.hostname}` + "/images/products/test.jpg"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}