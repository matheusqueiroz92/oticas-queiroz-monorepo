"use client";

import { useState, useCallback } from "react";
import type { Report } from "@/app/_types/report";

interface ReportPageState {
  showFilters: boolean;
  newReportDialogOpen: boolean;
  reportToEdit: Report | null;
}

interface ReportPageActions {
  toggleFilters: () => void;
  handleOpenNewReport: () => void;
  handleCloseNewReport: () => void;
  handleEditReport: (report: Report) => void;
  handleCloseEditReport: () => void;
  resetFilters: () => void;
}

export function useReportPageState() {
  const [state, setState] = useState<ReportPageState>({
    showFilters: false,
    newReportDialogOpen: false,
    reportToEdit: null,
  });

  const toggleFilters = useCallback(() => {
    setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  const handleOpenNewReport = useCallback(() => {
    setState(prev => ({ ...prev, newReportDialogOpen: true }));
  }, []);

  const handleCloseNewReport = useCallback(() => {
    setState(prev => ({ ...prev, newReportDialogOpen: false }));
  }, []);

  const handleEditReport = useCallback((report: Report) => {
    setState(prev => ({ ...prev, reportToEdit: report }));
  }, []);

  const handleCloseEditReport = useCallback(() => {
    setState(prev => ({ ...prev, reportToEdit: null }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(prev => ({ ...prev, showFilters: false }));
  }, []);

  const actions: ReportPageActions = {
    toggleFilters,
    handleOpenNewReport,
    handleCloseNewReport,
    handleEditReport,
    handleCloseEditReport,
    resetFilters,
  };

  return { state, actions };
} 