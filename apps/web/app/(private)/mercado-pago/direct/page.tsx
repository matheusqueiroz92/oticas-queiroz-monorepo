"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CreditCard } from "lucide-react";
import { DirectMercadoPagoButton } from "@/components/mercado-pago/DirectMercadoPagoButton";
import { useToast } from "@/hooks/useToast";

export default function MercadoPagoDirectPage() {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(100);
  const [description, setDescription] = useState<string>("Teste Óticas Queiroz");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAmount(isNaN(value) ? 0 : value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleSuccess = () => {
    toast({
      title: "Link de pagamento criado",
      description: "O link de pagamento foi criado com sucesso e aberto em uma nova janela.",
    });
  };

  const handleError = () => {
    toast({
      variant: "destructive",
      title: "Erro",
      description: "Ocorreu um erro ao criar o link de pagamento. Tente novamente.",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Teste Direto do Mercado Pago</h1>
      
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Modo de Teste</AlertTitle>
        <AlertDescription>
          Esta página se comunica diretamente com o Mercado Pago usando um token de teste.
          Nenhum valor real será cobrado ao realizar os testes.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Simular Pagamento</CardTitle>
          <CardDescription>
            Configure o valor e a descrição para o teste de pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                min="1"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={handleDescriptionChange}
              />
            </div>
          </div>
          
          <div className="flex justify-center mt-4">
            <DirectMercadoPagoButton
              amount={amount}
              description={description}
              onSuccess={handleSuccess}
              onError={handleError}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
      
      <Separator className="my-8" />
      
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
                Cartão APROVADO
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
                Cartão REJEITADO
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
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(
                  "https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards", 
                  "_blank",
                  "noopener,noreferrer"
                );
              }
            }}
          >
            Ver mais cartões de teste
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}