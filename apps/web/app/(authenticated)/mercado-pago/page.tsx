"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, CreditCard, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { api } from "@/app/services/authService";
import { MercadoPagoButton } from "@/components/MercadoPago/PaymentButton";

export default function MercadoPagoSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [testOrderId, setTestOrderId] = useState("");
  const [testAmount, setTestAmount] = useState(10);

  // Testar a conexão com o Mercado Pago
  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus("idle");
    
    try {
      // Chamada ao endpoint de teste
      const response = await api.get("/api/mercadopago/test-connection");
      
      if (response.status === 200) {
        setConnectionStatus("success");
        toast({
          title: "Conexão bem-sucedida",
          description: "A integração com o Mercado Pago está funcionando corretamente.",
        });
      } else {
        setConnectionStatus("error");
        toast({
          variant: "destructive",
          title: "Erro na conexão",
          description: "Não foi possível conectar ao Mercado Pago. Verifique as credenciais.",
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setConnectionStatus("error");
      toast({
        variant: "destructive",
        title: "Erro na conexão",
        description: "Não foi possível conectar ao Mercado Pago. Verifique as credenciais.",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Resetar o teste
  const resetTest = () => {
    setConnectionStatus("idle");
  };

  // Fake test payment handler (for demo purposes)
  const handleTestPaymentSuccess = () => {
    toast({
      title: "Pagamento de teste realizado",
      description: "O pagamento de teste foi processado com sucesso.",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Configurações do Mercado Pago</h1>
      
      <Tabs defaultValue="status">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Status da Conexão</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="test">Teste de Pagamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Status da Integração</CardTitle>
              <CardDescription>
                Verifique se a integração com o Mercado Pago está funcionando corretamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                {connectionStatus === "idle" ? (
                  <div className="flex items-center text-gray-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Status não verificado</span>
                  </div>
                ) : connectionStatus === "success" ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Integração funcionando corretamente</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Erro na integração</span>
                  </div>
                )}
                
                <Button 
                  onClick={testConnection} 
                  disabled={isTestingConnection}
                  variant={connectionStatus === "success" ? "outline" : "default"}
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : connectionStatus === "success" ? (
                    "Testar Novamente"
                  ) : (
                    "Testar Conexão"
                  )}
                </Button>
              </div>
              
              {connectionStatus === "success" && (
                <Alert className="bg-green-50 border-green-200 text-green-800 mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Integração ativa</AlertTitle>
                  <AlertDescription>
                    A integração com o Mercado Pago está configurada corretamente e pronta para uso.
                  </AlertDescription>
                </Alert>
              )}
              
              {connectionStatus === "error" && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro na integração</AlertTitle>
                  <AlertDescription>
                    Não foi possível conectar ao Mercado Pago. Verifique se as credenciais estão corretas
                    e se o token de acesso está ativo.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Voltar
              </Button>
              <Button onClick={resetTest} disabled={connectionStatus === "idle"}>
                Resetar
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações do Mercado Pago</CardTitle>
              <CardDescription>
                Links úteis e informações sobre a integração.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-sm font-medium">Dashboard do Mercado Pago</h3>
                  <p className="text-sm text-gray-600">
                    Acesse o dashboard do Mercado Pago para ver pagamentos, configurações e outras informações.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-fit"
                    onClick={() => window.open("https://www.mercadopago.com.br/developers/panel", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar Dashboard
                  </Button>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <h3 className="text-sm font-medium">Documentação</h3>
                  <p className="text-sm text-gray-600">
                    Consulte a documentação oficial do Mercado Pago para desenvolvedores.
                  </p>
                  <Button 
                    variant="outline"
                    className="w-fit"
                    onClick={() => window.open("https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Documentação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Mercado Pago</CardTitle>
              <CardDescription>
                Configurações da integração com o Mercado Pago.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Token de Acesso</h3>
                  <p className="text-sm text-gray-600">
                    O token de acesso é configurado no arquivo .env do servidor. 
                    Por segurança, ele não é exibido aqui.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Ambiente</h3>
                  <p className="text-sm text-gray-600">
                    A integração está configurada para o ambiente de {process.env.NODE_ENV === "production" ? "produção" : "sandbox (teste)"}.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Webhooks</h3>
                  <p className="text-sm text-gray-600">
                    Webhooks são usados para receber notificações do Mercado Pago quando o status de um pagamento muda.
                    O webhook está configurado para a URL:
                  </p>
                  <div className="flex items-center mt-1">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/api/mercadopago/webhook`} 
                      className="flex-1 bg-gray-50"
                    />
                    <Button 
                      variant="outline" 
                      className="ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/mercadopago/webhook`);
                        toast({
                          description: "URL copiada para a área de transferência",
                        });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Pagamento</CardTitle>
              <CardDescription>
                Realize um pagamento de teste para verificar a integração.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">ID do Pedido (opcional)</h3>
                  <p className="text-sm text-gray-600">
                    Se desejar, insira o ID de um pedido existente para testar a integração.
                  </p>
                  <Input 
                    placeholder="ID do pedido (opcional)" 
                    value={testOrderId}
                    onChange={(e) => setTestOrderId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Valor do Teste</h3>
                  <p className="text-sm text-gray-600">
                    Defina o valor para o pagamento de teste.
                  </p>
                  <Input 
                    type="number" 
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    min="1"
                  />
                </div>
                
                <div className="flex justify-center mt-6">
                  <MercadoPagoButton 
                    orderId={testOrderId || "test-payment"}
                    orderAmount={testAmount}
                    onPaymentSuccess={handleTestPaymentSuccess}
                    className="w-full md:w-auto"
                  />
                </div>
                
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ambiente de Teste</AlertTitle>
                  <AlertDescription>
                    Este é um ambiente de teste (sandbox). Nenhum pagamento real será processado.
                    Você pode usar os cartões de teste do Mercado Pago para simular pagamentos.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cartões de Teste</CardTitle>
              <CardDescription>
                Use estes cartões para testar pagamentos no ambiente de sandbox.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-3">
                  <h3 className="font-medium flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                    Cartão aprovado
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Número:</span> 5031 4332 1540 6351</p>
                    <p><span className="font-medium">CVV:</span> 123</p>
                    <p><span className="font-medium">Data:</span> 11/25</p>
                    <p><span className="font-medium">Nome:</span> APRO APRO</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-3">
                  <h3 className="font-medium flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-red-600" />
                    Cartão rejeitado
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Número:</span> 5031 4332 1540 6351</p>
                    <p><span className="font-medium">CVV:</span> 123</p>
                    <p><span className="font-medium">Data:</span> 11/25</p>
                    <p><span className="font-medium">Nome:</span> OTHE OTHE</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open("https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver mais cartões de teste
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}