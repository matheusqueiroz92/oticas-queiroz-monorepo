import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/useToast';
import { createTestPreference } from "@/app/services/mercadoPagoService";
import { formatCurrency } from '@/app/utils/formatters';

interface CheckoutButtonProps {
  amount: number;
  title?: string;
  description?: string;
  onSuccess?: () => void;
  onError?: () => void;
  className?: string;
}

export function CheckoutButton({ 
  amount, 
  title = "Pagamento Óticas Queiroz",
  description = "Pagamento de produtos e serviços",
  onSuccess,
  onError,
  className = "" 
}: CheckoutButtonProps) {
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
      console.log(`Iniciando checkout para valor ${amount}`);
      
      // Chamar API para criar preferência de teste
      const response = await createTestPreference(amount, description);
      
      console.log('Resposta da API:', response);
      
      // Obter URL de pagamento (sandbox em ambiente de desenvolvimento)
      const url = response.sandbox_init_point || response.init_point;
      
      if (!url) {
        throw new Error("URL de pagamento não encontrada na resposta");
      }
      
      setPaymentUrl(url);
      toast({
        title: "Link de pagamento gerado",
        description: "Redirecionando para a página de pagamento...",
      });
      
      // Abrir em nova janela
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