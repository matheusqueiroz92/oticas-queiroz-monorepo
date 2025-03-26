"use client";

import { useState, useEffect } from "react";
import { api } from "../services/authService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function ApiTester() {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [results, setResults] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);
  const [alternativeResults, setAlternativeResults] = useState<
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    Record<string, any>
  >({});

  // Lista de rotas a testar com e sem o prefixo "/api"
  const routesToTest = [
    { route: "/api/cash-registers", description: "Listar registros de caixa" },
    { route: "/api/cash-registers/current", description: "Caixa atual" },
    { route: "/api/payments", description: "Listar pagamentos" },
    {
      route: "/cash-registers",
      description: "Listar registros sem prefixo /api",
    },
    {
      route: "/cash-registers/current",
      description: "Caixa atual sem prefixo /api",
    },
    { route: "/payments", description: "Listar pagamentos sem prefixo /api" },
  ];

  // Função para testar uma rota específica
  const testRoute = async (route: string) => {
    try {
      // Log no console para acompanhamento
      console.log(`Testando rota: ${route}`);
      const response = await api.get(route);
      return {
        success: true,
        status: response.status,
        data: response.data,
      };
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
      console.error(`Erro ao testar ${route}:`, error);
      return {
        success: false,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      };
    }
  };

  // Função para testar rotas alternativas (diretamente com fetch)
  const testWithFetch = async (url: string) => {
    try {
      // Construir URL completa
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
      const fullUrl = `${baseUrl}${url}`;
      console.log(`Testando com fetch: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        headers: {
          "Content-Type": "application/json",
          // Adicione authorization se necessário
        },
      });

      const data = await response.json().catch(() => null);

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
      console.error(`Erro ao testar com fetch ${url}:`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  };

  // Função para executar todos os testes
  const runAllTests = async () => {
    setTesting(true);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const testResults: Record<string, any> = {};
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const altResults: Record<string, any> = {};

    // Testar com Axios
    for (const { route } of routesToTest) {
      testResults[route] = await testRoute(route);
    }

    // Testar com fetch direto
    for (const { route } of routesToTest) {
      altResults[route] = await testWithFetch(route);
    }

    setResults(testResults);
    setAlternativeResults(altResults);
    setTesting(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico de API</CardTitle>
          <CardDescription>
            Teste as rotas da API para identificar problemas de configuração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <Button
                onClick={runAllTests}
                disabled={testing}
                className="w-full max-w-sm"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando Rotas...
                  </>
                ) : (
                  "Iniciar Diagnóstico de API"
                )}
              </Button>
            </div>

            {Object.keys(results).length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Resultados com Axios
                  </h3>
                  <div className="space-y-3">
                    {routesToTest.map(({ route, description }) => (
                      <div
                        key={route}
                        className={`p-3 rounded-md ${
                          results[route]?.success
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {results[route]?.success ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">{route}</p>
                              <p className="text-sm text-gray-500">
                                {description}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm">
                            Status:{" "}
                            <span
                              className={
                                results[route]?.success
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {results[route]?.status || "N/A"}
                            </span>
                          </div>
                        </div>

                        {results[route]?.message && (
                          <p className="text-sm text-red-600 mt-1">
                            {results[route].message}
                          </p>
                        )}

                        {results[route]?.success && (
                          <details className="mt-2">
                            <summary className="text-sm cursor-pointer">
                              Ver resposta
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-60">
                              {JSON.stringify(results[route].data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Resultados com Fetch
                  </h3>
                  <div className="space-y-3">
                    {routesToTest.map(({ route, description }) => (
                      <div
                        key={`fetch-${route}`}
                        className={`p-3 rounded-md ${
                          alternativeResults[route]?.success
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {alternativeResults[route]?.success ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">{route}</p>
                              <p className="text-sm text-gray-500">
                                {description}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm">
                            Status:{" "}
                            <span
                              className={
                                alternativeResults[route]?.success
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {alternativeResults[route]?.status || "N/A"}
                            </span>
                          </div>
                        </div>

                        {alternativeResults[route]?.message && (
                          <p className="text-sm text-red-600 mt-1">
                            {alternativeResults[route].message}
                          </p>
                        )}

                        {alternativeResults[route]?.success && (
                          <details className="mt-2">
                            <summary className="text-sm cursor-pointer">
                              Ver resposta
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-60">
                              {JSON.stringify(
                                alternativeResults[route].data,
                                null,
                                2
                              )}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Seção de análise e recomendações */}
            {Object.keys(results).length > 0 && (
              <div className="mt-6 bg-blue-50 p-4 rounded-md border border-blue-200">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  Análise e Recomendações
                </h3>
                <div className="space-y-2">
                  {routesToTest.some(
                    ({ route }) =>
                      route.startsWith("/api") && results[route]?.success
                  ) && (
                    <p className="text-blue-700">
                      ✅ Rotas com prefixo '/api' funcionando. Continue usando
                      este formato.
                    </p>
                  )}

                  {routesToTest.some(
                    ({ route }) =>
                      !route.startsWith("/api") && results[route]?.success
                  ) && (
                    <p className="text-blue-700">
                      ✅ Rotas sem prefixo '/api' funcionando. Considere
                      atualizar todas as chamadas para este formato.
                    </p>
                  )}

                  {routesToTest.every(
                    ({ route }) =>
                      route.startsWith("/api") && !results[route]?.success
                  ) && (
                    <p className="text-red-600">
                      ❌ Todas as rotas com prefixo '/api' falharam. Tente
                      remover este prefixo das chamadas.
                    </p>
                  )}

                  {routesToTest.every(
                    ({ route }) => !results[route]?.success
                  ) && (
                    <div>
                      <p className="text-red-600">
                        ❌ Todas as rotas falharam. Verifique:
                      </p>
                      <ul className="list-disc list-inside ml-4 text-red-600">
                        <li>Se o servidor backend está rodando</li>
                        <li>
                          Se a URL base está correta (
                          {process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:3333"}
                          )
                        </li>
                        <li>Se há problemas de CORS</li>
                        <li>Se há problemas de autenticação</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reiniciar Teste
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
