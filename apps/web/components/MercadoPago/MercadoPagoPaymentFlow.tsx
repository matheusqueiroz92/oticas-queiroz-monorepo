import React, { useState, useEffect } from 'react';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { Button } from '@/components/ui/button';
import { PaymentStatus } from '@/components/MercadoPago/PaymentStatus';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/app/utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MercadoPagoPaymentFlowProps {
  orderId: string;
  orderAmount: number;
  orderNumber?: string;
  onPaymentSuccess?: () => void;
  onPaymentFailure?: () => void;
  onPaymentCancel?: () => void;
}

export function MercadoPagoPaymentFlow({ 
  orderId, 
  orderAmount,
  orderNumber,
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentCancel
}: MercadoPagoPaymentFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(true);
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

  // Iniciar pagamento quando o componente montar
  useEffect(() => {
    if (orderId && orderAmount) {
      handlePayment(orderId);
    }
  }, [orderId, orderAmount]);
  
  const handleOpenPayment = () => {
    openPaymentWindow();
    setShowStatus(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetPaymentState();
    if (onPaymentCancel) {
      onPaymentCancel();
    }
  };
  
  // Atualizar estado após pagamento bem-sucedido
  useEffect(() => {
    if (paymentStatus === 'approved' && onPaymentSuccess) {
      toast({
        title: "Pagamento aprovado!",
        description: "Seu pagamento foi processado com sucesso.",
        variant: "default",
      });
      onPaymentSuccess();
    } else if (paymentStatus === 'rejected' && onPaymentFailure) {
      toast({
        title: "Pagamento rejeitado",
        description: "Houve um problema com seu pagamento. Por favor, tente novamente.",
        variant: "destructive",
      });
      onPaymentFailure();
    }
  }, [paymentStatus, onPaymentSuccess, onPaymentFailure, toast]);

  return (
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
  );
}