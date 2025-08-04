"use client";

import { useState } from "react";

interface InstitutionPageState {
  newInstitutionDialogOpen: boolean;
  institutionToEdit: any;
  showFilters: boolean;
  selectedStatus: string;
  selectedIndustryType: string;
}

interface InstitutionPageActions {
  handleOpenNewDialog: () => void;
  handleCloseNewDialog: () => void;
  handleEditInstitution: (institution: any) => void;
  handleCloseEditDialog: () => void;
  toggleFilters: () => void;
  setSelectedStatus: (status: string) => void;
  setSelectedIndustryType: (industryType: string) => void;
  resetFilters: () => void;
}

export function useInstitutionPageState() {
  const [state, setState] = useState<InstitutionPageState>({
    newInstitutionDialogOpen: false,
    institutionToEdit: null,
    showFilters: false,
    selectedStatus: "todos",
    selectedIndustryType: "todos",
  });

  const actions: InstitutionPageActions = {
    handleOpenNewDialog: () => {
      setState(prev => ({ ...prev, newInstitutionDialogOpen: true }));
    },
    
    handleCloseNewDialog: () => {
      setState(prev => ({ ...prev, newInstitutionDialogOpen: false }));
    },
    
    handleEditInstitution: (institution) => {
      setState(prev => ({
        ...prev,
        institutionToEdit: institution
      }));
    },
    
    handleCloseEditDialog: () => {
      setState(prev => ({
        ...prev,
        institutionToEdit: null
      }));
    },
    
    toggleFilters: () => {
      setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
    },
    
    setSelectedStatus: (status) => {
      setState(prev => ({ ...prev, selectedStatus: status }));
    },
    
    setSelectedIndustryType: (industryType) => {
      setState(prev => ({ ...prev, selectedIndustryType: industryType }));
    },
    
    resetFilters: () => {
      setState(prev => ({
        ...prev,
        selectedStatus: "todos",
        selectedIndustryType: "todos",
      }));
    },
  };

  return { state, actions };
}