"use client";

import { useState } from "react";

interface InstitutionDetailsState {
  editDialogOpen: boolean;
}

interface InstitutionDetailsActions {
  handleOpenEditDialog: () => void;
  handleCloseEditDialog: () => void;
}

export function useInstitutionDetailsState() {
  const [state, setState] = useState<InstitutionDetailsState>({
    editDialogOpen: false,
  });

  const actions: InstitutionDetailsActions = {
    handleOpenEditDialog: () => {
      setState(prev => ({ ...prev, editDialogOpen: true }));
    },
    handleCloseEditDialog: () => {
      setState(prev => ({ ...prev, editDialogOpen: false }));
    },
  };

  return { state, actions };
}