import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPaymentPreference, getPaymentInfo } from '@/app/services/mercadoPagoService';
import { QUERY_KEYS } from '@/app/constants/query-keys';

export function useMercadoPago() {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate: createPreference, isPending: isCreatingPreference } = useMutation({
    mutationFn: (orderId: string) => createPaymentPreference(orderId),
    onSuccess: (data) => {
      setPreferenceId(data.id);
      // Em ambiente de desenvolvimento, usamos o sandbox_init_point
      // Em produção, usaríamos o init_point
      setPaymentUrl(data.sandbox_init_point || data.init_point);
    },
  });

  const { data: paymentInfo, isLoading: isLoadingPaymentInfo } = useQuery({
    queryKey: QUERY_KEYS.MERCADO_PAGO.PAYMENT_INFO(preferenceId || ''),
    queryFn: () => getPaymentInfo(preferenceId || ''),
    enabled: !!preferenceId,
    refetchInterval: preferenceId ? 5000 : false, // Refetch a cada 5 segundos quando há preferenceId
  });

  const handlePayment = (orderId: string) => {
    createPreference(orderId);
  };

  const openPaymentWindow = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  return {
    handlePayment,
    openPaymentWindow,
    preferenceId,
    paymentUrl,
    paymentInfo,
    isCreatingPreference,
    isLoadingPaymentInfo
  };
}