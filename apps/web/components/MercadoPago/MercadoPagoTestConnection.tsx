"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SimplePaymentButton } from "@/components/MercadoPago/SimplePaymentButton";
import { CreditCard, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { createPaymentPreference, testConnection } from "@/app/services/mercadoPagoService";
import { DirectTestButton } from "./DirectTestButton";
import { SimpleMercadoPagoButton } from "@/components/MercadoPago/SimpleMercadoPagoButton";

export default function MercadoPagoTestPage() {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Teste de conexão com o Mercado Pago
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus("idle");
    
    try {
      await testConnection();
      setConnectionStatus("success");
      toast({
        title: "Conexão OK",
        description: "A conexão com o Mercado Pago está funcionando corretamente.",
      });
    } catch (error) {
      setConnectionStatus("error");
      toast({
        variant: "destructive",
        title: "Erro na conexão",
        description: "Não foi possível conectar com o Mercado Pago. Verifique as credenciais.",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Teste de criação de preferência diretamente
  const handleCreatePreference = async () => {
    if (!orderId) {
      toast({
        variant: "destructive",
        title: "ID do pedido necessário",
        description: "Por favor, informe o ID do pedido para testar.",
      });
      return;
    }
    
    try {
      const response = await createPaymentPreference(orderId);
      
      if (response && response.id) {
        setPreferenceId(response.id);
        setPaymentUrl(response.sandbox_init_point || response.init_point);
        
        toast({
          title: "Preferência criada",
          description: "Preferência de pagamento criada com sucesso.",
        });
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Teste do Mercado Pago</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teste de Conexão</CardTitle>
            <CardDescription>
              Verifica se a integração com o Mercado Pago está funcionando.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? "Testando..." : "Testar Conexão"}
            </Button>
            
            {connectionStatus === "success" && (
              <Alert className="mt-4 bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Conexão estabelecida</AlertTitle>
                <AlertDescription>
                  A conexão com o Mercado Pago está funcionando corretamente.
                </AlertDescription>
              </Alert>
            )}
            
            {connectionStatus === "error" && (
              <Alert className="mt-4 bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro na conexão</AlertTitle>
                <AlertDescription>
                  Não foi possível estabelecer conexão com o Mercado Pago. Verifique as credenciais.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Teste de Pagamento</CardTitle>
            <CardDescription>
              Teste a criação de uma preferência de pagamento para um pedido específico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ID do Pedido</label>
              <Input 
                placeholder="Informe o ID do pedido" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Informe o ID de um pedido existente no sistema.
              </p>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreatePreference}>Criar Preferência</Button>
              
              {orderId && (
                <SimplePaymentButton orderId={orderId} />
              )}
            </div>
            
            {preferenceId && paymentUrl && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                <div>
                  <span className="font-medium">ID da Preferência:</span>
                  <span className="ml-2">{preferenceId}</span>
                </div>
                
                <div>
                  <span className="font-medium">URL de Pagamento:</span>
                  <Button 
                    variant="link" 
                    className="text-blue-600 p-0 h-auto"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(
                          paymentUrl!,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                  >
                    Abrir página de pagamento <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teste Direto</CardTitle>
            <CardDescription>
              Teste rápido da integração sem depender de pedidos existentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor do Teste</label>
              <div className="flex space-x-2">
                <DirectTestButton amount={10} description="Teste R$10" />
                <DirectTestButton amount={50} description="Teste R$50" />
                <DirectTestButton amount={100} description="Teste R$100" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Este teste cria uma preferência diretamente, sem necessidade de um pedido existente.
              </p>
            </div>
            
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Modo de Teste</AlertTitle>
              <AlertDescription>
                Estes pagamentos são apenas para teste. Nenhum valor real será cobrado.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Informações Úteis</CardTitle>
            <CardDescription>
              Dicas e recursos para testar o Mercado Pago.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Cartões de Teste</h3>
              <p className="text-sm text-gray-600 mt-1">
                Use estes cartões para testar pagamentos no ambiente de sandbox.
              </p>
              
              <div className="mt-2 p-3 border rounded-md">
                <h4 className="font-medium">Cartão aprovado</h4>
                <div className="mt-1 space-y-1 text-sm">
                  <p><span className="font-medium">Número:</span> 5031 4332 1540 6351</p>
                  <p><span className="font-medium">CVV:</span> 123</p>
                  <p><span className="font-medium">Data:</span> 11/25</p>
                  <p><span className="font-medium">Nome:</span> APRO APRO</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium">Links úteis</h3>
              <div className="mt-2 space-y-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open("https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Cartões de teste
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open("https://www.mercadopago.com.br/developers/panel", "_blank")}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Dashboard do Mercado Pago
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <SimpleMercadoPagoButton amount={100} description="Meu produto" />
      </div>
    </div>
  );
}