import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/useToast';

// Substitua pelo seu token de teste
const MERCADO_PAGO_TOKEN = "TEST-1544640820657133-042516-98c5cc97a49104dfb9b1bb9377667e65-93300345";

interface SimpleMercadoPagoButtonProps {
  amount: number;
  description?: string;
  className?: string;
}

export function SimpleMercadoPagoButton({
  amount,
  description = "Pagamento Óticas Queiroz",
  className = ""
}: SimpleMercadoPagoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      // Criar preferência diretamente
      const preference = {
        items: [
          {
            id: `test-${Date.now()}`,
            title: "Produto Óticas Queiroz",
            description: description,
            quantity: 1,
            currency_id: "BRL",
            unit_price: amount
          }
        ]
        // Apenas o mínimo necessário
      };
      
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preference)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar preferência');
      }
      
      const data = await response.json();
      
      // Abrir link de pagamento
      if (data.sandbox_init_point) {
        window.open(data.sandbox_init_point, '_blank');
        
        toast({
          title: "Pagamento iniciado",
          description: "Uma nova janela foi aberta para concluir o pagamento"
        });
      } else {
        throw new Error('Link de pagamento não encontrado');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      className={`flex items-center gap-2 ${className}`}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          Pagar com Mercado Pago
        </>
      )}
    </Button>
  );
}