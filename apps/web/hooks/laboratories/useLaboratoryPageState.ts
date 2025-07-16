import { useState, useCallback } from 'react';

export interface LaboratoryPageState {
  newLaboratoryDialogOpen: boolean;
  editLaboratoryDialogOpen: boolean;
  laboratoryToEdit: any;
  showFilters: boolean;
  selectedStatus: string;
  selectedCity: string;
}

export function useLaboratoryPageState() {
  const [newLaboratoryDialogOpen, setNewLaboratoryDialogOpen] = useState(false);
  const [editLaboratoryDialogOpen, setEditLaboratoryDialogOpen] = useState(false);
  const [laboratoryToEdit, setLaboratoryToEdit] = useState<any>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [selectedCity, setSelectedCity] = useState("todos");

  const handleOpenNewLaboratory = useCallback(() => {
    setNewLaboratoryDialogOpen(true);
  }, []);

  const handleCloseNewLaboratory = useCallback(() => {
    setNewLaboratoryDialogOpen(false);
  }, []);

  const handleEditLaboratory = useCallback((laboratory: any) => {
    setLaboratoryToEdit(laboratory);
    setEditLaboratoryDialogOpen(true);
  }, []);

  const handleCloseEditLaboratory = useCallback(() => {
    setEditLaboratoryDialogOpen(false);
    setLaboratoryToEdit(undefined);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedStatus("todos");
    setSelectedCity("todos");
  }, []);

  return {
    state: {
      newLaboratoryDialogOpen,
      editLaboratoryDialogOpen,
      laboratoryToEdit,
      showFilters,
      selectedStatus,
      selectedCity,
    },
    actions: {
      handleOpenNewLaboratory,
      handleCloseNewLaboratory,
      handleEditLaboratory,
      handleCloseEditLaboratory,
      toggleFilters,
      resetFilters,
      setSelectedStatus,
      setSelectedCity,
    },
  };
} 