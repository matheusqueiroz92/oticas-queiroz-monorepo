"use client";

import { useState } from "react";

interface LegacyClientDetailsState {
  editDialogOpen: boolean;
}

interface LegacyClientDetailsActions {
  handleOpenEditDialog: () => void;
  handleCloseEditDialog: () => void;
}

export function useLegacyClientDetailsState() {
  const [state, setState] = useState<LegacyClientDetailsState>({
    editDialogOpen: false,
  });

  const actions: LegacyClientDetailsActions = {
    handleOpenEditDialog: () => {
      setState(prev => ({ ...prev, editDialogOpen: true }));
    },
    handleCloseEditDialog: () => {
      setState(prev => ({ ...prev, editDialogOpen: false }));
    },
  };

  return { state, actions };
} 