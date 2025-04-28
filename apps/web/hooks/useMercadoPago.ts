import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPaymentPreference, getPaymentInfo, processPayment } from '@/app/services/mercadoPagoService';
import { QUERY_KEYS } from '@/app/constants/query-keys';
import { useToast } from '@/hooks/useToast';

export function useMercadoPago() {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentWindowOpened, setPaymentWindowOpened] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation para criar preferência de pagamento
  const { mutate: createPreference, isPending: isCreatingPreference } = useMutation({
    mutationFn: (orderId: string) => createPaymentPreference(orderId),
    onSuccess: (data) => {
      setPreferenceId(data.id);
      // Em ambiente de desenvolvimento, usamos o sandbox_init_point
      // Em produção, usaríamos o init_point
      setPaymentUrl(data.sandbox_init_point || data.init_point);
      toast({
        title: "Pagamento pronto",
        description: "Clique em 'Pagar agora' para ir para a página de pagamento.",
      });
    },
    onError: (error) => {
      console.error("Erro ao criar preferência:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o link de pagamento. Tente novamente.",
      });
    }
  });

  // Query para acompanhar o status do pagamento
  const { 
    data: paymentInfo, 
    isLoading: isLoadingPaymentInfo,
    refetch: refetchPaymentInfo 
  } = useQuery({
    queryKey: QUERY_KEYS.MERCADO_PAGO.PAYMENT_INFO(preferenceId || ''),
    queryFn: () => preferenceId ? getPaymentInfo(preferenceId) : null,
    enabled: !!preferenceId && paymentWindowOpened,
    refetchInterval: (paymentWindowOpened && preferenceId && !paymentStatus) ? 5000 : false,
  });
  
  // Efeito para lidar com a mudança de status do pagamento
  useEffect(() => {
    if (paymentInfo && typeof paymentInfo === 'object') {
      if ('status' in paymentInfo) {
        setPaymentStatus(paymentInfo.status as string);
        
        if ('id' in paymentInfo) {
          setPaymentId(String(paymentInfo.id));
        }
        
        // Se pagamento aprovado, invalidar caches relevantes
        if (paymentInfo.status === 'approved') {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS.ALL] });
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENTS.ALL] });
          
          toast({
            title: "Pagamento aprovado!",
            description: "Seu pagamento foi processado com sucesso.",
            variant: "default",
          });
        }
        
        // Se pagamento rejeitado
        if (paymentInfo.status === 'rejected') {
          toast({
            title: "Pagamento rejeitado",
            description: "Houve um problema com seu pagamento. Por favor, tente novamente.",
            variant: "destructive",
          });
        }
      }
    }
  }, [paymentInfo, queryClient, toast]);

  // Processa um pagamento já existente (para webhooks)
  const { mutate: processExistingPayment } = useMutation({
    mutationFn: (paymentId: string) => processPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS.ALL] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENTS.ALL] });
    }
  });

  // Iniciar processo de pagamento
  const handlePayment = (orderId: string) => {
    setPaymentStatus(null);
    setPaymentId(null);
    setPreferenceId(null);
    setPaymentUrl(null);
    setPaymentWindowOpened(false);
    createPreference(orderId);
  };

  // Abrir janela de pagamento
  const openPaymentWindow = () => {
    if (paymentUrl) {
      const paymentWindow = window.open(paymentUrl, '_blank');
      setPaymentWindowOpened(true);
      
      // Iniciar verificação de status
      if (preferenceId) {
        refetchPaymentInfo();
      }
      
      return paymentWindow;
    }
    return null;
  };

  // Resetar o estado
  const resetPaymentState = () => {
    setPaymentStatus(null);
    setPaymentId(null);
    setPreferenceId(null);
    setPaymentUrl(null);
    setPaymentWindowOpened(false);
  };

  return {
    handlePayment,
    openPaymentWindow,
    resetPaymentState,
    processExistingPayment,
    refetchPaymentInfo,
    preferenceId,
    paymentId,
    paymentUrl,
    paymentStatus,
    paymentInfo,
    isCreatingPreference,
    isLoadingPaymentInfo,
    paymentWindowOpened
  };
}