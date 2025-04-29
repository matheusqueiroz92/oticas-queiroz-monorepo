import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/useToast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from '@/app/utils/formatters';

// Insira seu token de acesso do Mercado Pago para testes
// IMPORTANTE: Nunca exponha tokens de produção no código frontend
// Esta é apenas uma implementação para TESTES
const TEST_TOKEN = 'TEST-1544640820657133-042516-98c5cc97a49104dfb9b1bb9377667e65-93300345';

interface DirectMercadoPagoButtonProps {
  title?: string;
  amount: number;
  description?: string;
  onSuccess?: () => void;
  onError?: () => void;
  className?: string;
}

export function DirectMercadoPagoButton({
  title = "Pagamento Óticas Queiroz",
  amount,
  description = "Pagamento de produtos e serviços",
  onSuccess,
  onError,
  className = ""
}: DirectMercadoPagoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log(`Iniciando pagamento direto para valor ${amount}`);
      
      // Criar a preferência de pagamento diretamente com a API do Mercado Pago
      const preference = {
        items: [
          {
            id: `test-${Date.now()}`,
            title: title,
            description: description,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: Number(amount)
          }
        ],
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          pending: `${window.location.origin}/payment/pending`,
          failure: `${window.location.origin}/payment/failure`
        },
        notification_url: `${window.location.origin}/api/mercadopago/webhook`,
        auto_return: 'approved',
        statement_descriptor: 'Óticas Queiroz'
      };
      
      console.log('Enviando preferência:', preference);
      
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preference)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar preferência de pagamento');
      }
      
      const data = await response.json();
      console.log('Resposta do Mercado Pago:', data);
      
      // Usar o link do sandbox para ambiente de teste
      const url = data.sandbox_init_point || data.init_point;
      
      if (!url) {
        throw new Error("URL de pagamento não encontrada na resposta");
      }
      
      setPaymentUrl(url);
      toast({
        title: "Link de pagamento gerado",
        description: "Redirecionando para a página de pagamento...",
      });
      
      // Abrir a página de pagamento
      window.open(url, '_blank');
      
      // Chamar callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao gerar link de pagamento:", error);
      
      toast({
        variant: "destructive",
        title: "Erro ao gerar link de pagamento",
        description: error instanceof Error 
          ? error.message 
          : "Erro desconhecido ao processar o pagamento",
      });
      
      // Chamar callback de erro
      if (onError) {
        onError();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button 
        onClick={handleClick} 
        className={`flex items-center gap-2 ${className}`}
      >
        <CreditCard className="h-4 w-4" />
        Pagar com Mercado Pago
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Você será redirecionado para a plataforma de pagamento do Mercado Pago.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="text-center mb-4">
              <div className="font-semibold text-lg">Valor a pagar:</div>
              <div className="text-2xl text-primary font-bold">
                {formatCurrency(amount)}
              </div>
            </div>
            
            <p className="text-sm text-center text-gray-600">
              Ao prosseguir, você será redirecionado para a página do Mercado Pago 
              onde poderá escolher a forma de pagamento de sua preferência.
            </p>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Prosseguir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}