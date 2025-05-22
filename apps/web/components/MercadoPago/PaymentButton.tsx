import React, { useState, useEffect } from 'react';
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
import { PaymentStatus } from './PaymentStatus';
import { formatCurrency } from '@/app/_utils/formatters';

interface PaymentButtonProps {
  orderId: string;
  orderAmount: number;
  orderNumber?: string;
  onPaymentSuccess?: () => void;
  onPaymentFailure?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function MercadoPagoButton({ 
  orderId, 
  orderAmount,
  orderNumber,
  onPaymentSuccess,
  onPaymentFailure,
  className = "",
  variant = "default",
  size = "default"
}: PaymentButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  
  const { 
    handlePayment, 
    openPaymentWindow, 
    resetPaymentState,
    refetchPaymentInfo,
    paymentUrl, 
    paymentStatus,
    paymentId,
    preferenceId,
    isCreatingPreference,
    isLoadingPaymentInfo,
    paymentWindowOpened
  } = useMercadoPago();

  const handleInitPayment = () => {
    setIsDialogOpen(true);
    setShowStatus(false);
    handlePayment(orderId);
  };
  
  const handleOpenPayment = () => {
    openPaymentWindow();
    setShowStatus(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetPaymentState();
  };
  
  // Atualizar estado após pagamento bem-sucedido
  useEffect(() => {
    if (paymentStatus === 'approved' && onPaymentSuccess) {
      onPaymentSuccess();
    } else if (paymentStatus === 'rejected' && onPaymentFailure) {
      onPaymentFailure();
    }
  }, [paymentStatus, onPaymentSuccess, onPaymentFailure]);

  return (
    <>
      <Button 
        onClick={handleInitPayment} 
        className={`flex items-center gap-2 ${className}`}
        variant={variant}
        size={size}
      >
        <CreditCard className="h-4 w-4" />
        Pagar com Mercado Pago
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          {!showStatus ? (
            <>
              <DialogHeader>
                <DialogTitle>Pagamento via Mercado Pago</DialogTitle>
                <DialogDescription>
                  {orderNumber 
                    ? `Pagamento da ordem de serviço #${orderNumber}`
                    : 'Você será redirecionado para a página de pagamento do Mercado Pago.'}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="text-center mb-4">
                  <div className="font-semibold text-lg">Total a pagar:</div>
                  <div className="text-2xl text-primary font-bold">
                    {formatCurrency(orderAmount)}
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
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleOpenPayment}
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
            </>
          ) : (
            <PaymentStatus 
              status={paymentStatus as any}
              preferenceId={preferenceId || undefined}
              paymentId={paymentId || undefined}
              isLoading={isLoadingPaymentInfo}
              onRefreshStatus={refetchPaymentInfo}
              onClose={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}