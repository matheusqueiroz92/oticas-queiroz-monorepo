"use client";

import { useState } from "react";

interface CashRegisterPageState {
  showFilters: boolean;
  selectedStatus: string;
  date?: Date;
}

interface CashRegisterPageActions {
  toggleFilters: () => void;
  setSelectedStatus: (status: string) => void;
  setDate: (date?: Date) => void;
  resetFilters: () => void;
}

export function useCashRegisterPageState() {
  const [state, setState] = useState<CashRegisterPageState>({
    showFilters: false,
    selectedStatus: "todos",
    date: undefined,
  });

  const actions: CashRegisterPageActions = {
    toggleFilters: () => {
      setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
    },
    
    setSelectedStatus: (status) => {
      setState(prev => ({ ...prev, selectedStatus: status }));
    },
    
    setDate: (date) => {
      setState(prev => ({ ...prev, date }));
    },
    
    resetFilters: () => {
      setState(prev => ({
        ...prev,
        selectedStatus: "todos",
        date: undefined,
      }));
    },
  };

  return { state, actions };
}