"use client";

import { useState, useCallback } from "react";
import type { LegacyClient } from "@/app/_types/legacy-client";

interface LegacyClientPageState {
  showFilters: boolean;
  newClientDialogOpen: boolean;
  clientToEdit: LegacyClient | null;
}

interface LegacyClientPageActions {
  toggleFilters: () => void;
  handleOpenNewClient: () => void;
  handleCloseNewClient: () => void;
  handleEditClient: (client: LegacyClient) => void;
  handleCloseEditClient: () => void;
  resetFilters: () => void;
}

export function useLegacyClientPageState() {
  const [state, setState] = useState<LegacyClientPageState>({
    showFilters: false,
    newClientDialogOpen: false,
    clientToEdit: null,
  });

  const toggleFilters = useCallback(() => {
    setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  const handleOpenNewClient = useCallback(() => {
    setState(prev => ({ ...prev, newClientDialogOpen: true }));
  }, []);

  const handleCloseNewClient = useCallback(() => {
    setState(prev => ({ ...prev, newClientDialogOpen: false }));
  }, []);

  const handleEditClient = useCallback((client: LegacyClient) => {
    setState(prev => ({ ...prev, clientToEdit: client }));
  }, []);

  const handleCloseEditClient = useCallback(() => {
    setState(prev => ({ ...prev, clientToEdit: null }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(prev => ({ ...prev, showFilters: false }));
  }, []);

  const actions: LegacyClientPageActions = {
    toggleFilters,
    handleOpenNewClient,
    handleCloseNewClient,
    handleEditClient,
    handleCloseEditClient,
    resetFilters,
  };

  return { state, actions };
} 