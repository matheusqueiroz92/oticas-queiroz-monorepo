import { useState, useCallback } from 'react';

interface PaymentsPageState {
  showFilters: boolean;
  paymentDialogOpen: boolean;
}

interface PaymentsPageActions {
  toggleFilters: () => void;
  handleOpenNewPayment: () => void;
  handleClosePaymentDialog: () => void;
}

export function usePaymentsPageState() {
  const [state, setState] = useState<PaymentsPageState>({
    showFilters: false,
    paymentDialogOpen: false,
  });

  const toggleFilters = useCallback(() => {
    setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  const handleOpenNewPayment = useCallback(() => {
    setState(prev => ({ ...prev, paymentDialogOpen: true }));
  }, []);

  const handleClosePaymentDialog = useCallback(() => {
    setState(prev => ({ ...prev, paymentDialogOpen: false }));
  }, []);

  const actions: PaymentsPageActions = {
    toggleFilters,
    handleOpenNewPayment,
    handleClosePaymentDialog,
  };

  return { state, actions };
} 