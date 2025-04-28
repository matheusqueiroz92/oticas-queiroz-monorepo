import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentButtonProps {
  orderId: string;
  orderAmount: number;
  className?: string;
}

export function MercadoPagoButton({ orderId, orderAmount, className }: PaymentButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { 
    handlePayment, 
    openPaymentWindow, 
    paymentUrl, 
    isCreatingPreference 
  } = useMercadoPago();

  const handleInitPayment = () => {
    setIsDialogOpen(true);
    handlePayment(orderId);
  };

  return (
    <>
      <Button 
        onClick={handleInitPayment} 
        className={`flex items-center gap-2 ${className}`}
        variant="default"
      >
        <CreditCard className="h-4 w-4" />
        Pagar com Mercado Pago
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento via Mercado Pago</DialogTitle>
            <DialogDescription>
              Você será redirecionado para a página de pagamento do Mercado Pago para concluir sua compra.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="text-center mb-4">
              <div className="font-semibold text-lg">Total a pagar:</div>
              <div className="text-2xl text-primary font-bold">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(orderAmount)}
              </div>
            </div>

            {isCreatingPreference ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  Preparando sua página de pagamento...
                </p>
              </div>
            ) : paymentUrl ? (
              <div className="text-center">
                <p className="mb-4 text-sm text-gray-600">
                  Clique no botão abaixo para finalizar seu pagamento no site do Mercado Pago.
                </p>
              </div>
            ) : (
              <div className="text-center text-red-500">
                <p>Ocorreu um erro ao gerar o link de pagamento. Por favor, tente novamente.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={openPaymentWindow}
              disabled={!paymentUrl || isCreatingPreference}
              className="gap-2"
            >
              {isCreatingPreference ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparando pagamento...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pagar agora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}