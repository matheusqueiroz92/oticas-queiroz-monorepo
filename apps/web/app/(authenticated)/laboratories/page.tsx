"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { LaboratoryStatsCards } from "@/components/laboratories/LaboratoryStatsCards";
import { LaboratoryTableWithFilters } from "@/components/laboratories/LaboratoryTableWithFilters";
import { LaboratoryDialogs } from "@/components/laboratories/LaboratoryDialogs";
import { useLaboratoriesList } from "@/hooks/laboratories/useLaboratoriesList";
import { useLaboratoryPageState } from "@/hooks/laboratories/useLaboratoryPageState";
import { useLaboratoryFilters } from "@/hooks/laboratories/useLaboratoryFilters";
import { useLaboratoryStats } from "@/hooks/laboratories/useLaboratoryStats";

export default function LaboratoriesPage() {
  const { state, actions } = useLaboratoryPageState();
  
  const {
    laboratories,
    isLoading,
    error,
    search,
    setSearch,
    navigateToLaboratoryDetails,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    limit,
    refetch,
    filters,
    updateFilters,
    getActiveFiltersCount,
  } = useLaboratoriesList();

  const {
    handleUpdateFilters,
    handleClearAllFilters,
    applyBasicFilters,
  } = useLaboratoryFilters(search, setSearch, filters, updateFilters, getActiveFiltersCount);

  const stats = useLaboratoryStats(laboratories, totalItems);

  // Aplicar filtros quando os selects básicos mudarem
  useEffect(() => {
    applyBasicFilters(state.selectedStatus, state.selectedCity);
  }, [state.selectedStatus, state.selectedCity, applyBasicFilters]);

  // Limpar filtros incluindo os estados locais
  const handleClearFilters = () => {
    actions.resetFilters();
    handleClearAllFilters();
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <LaboratoryStatsCards
          totalLaboratories={stats.totalLaboratories}
          activeLaboratories={stats.activeLaboratories}
          inactiveLaboratories={stats.inactiveLaboratories}
          newThisMonth={stats.newThisMonth}
          topCities={stats.topCities}
        />

        {/* Tabela de Laboratórios com Filtros */}
        <LaboratoryTableWithFilters
          laboratories={laboratories}
          isLoading={isLoading}
          error={error}
          search={search}
          onSearchChange={setSearch}
          showFilters={state.showFilters}
          onToggleFilters={actions.toggleFilters}
          activeFiltersCount={getActiveFiltersCount}
          selectedStatus={state.selectedStatus}
          onStatusChange={actions.setSelectedStatus}
          filters={filters}
          onUpdateFilters={handleUpdateFilters}
          onClearFilters={handleClearFilters}
          onNewLaboratory={actions.handleOpenNewLaboratory}
          onDetailsClick={navigateToLaboratoryDetails}
          onEditClick={actions.handleEditLaboratory}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          limit={limit}
        />

        {/* Diálogos */}
        <LaboratoryDialogs
          newLaboratoryDialogOpen={state.newLaboratoryDialogOpen}
          editLaboratoryDialogOpen={state.editLaboratoryDialogOpen}
          laboratoryToEdit={state.laboratoryToEdit}
          onNewLaboratoryDialogChange={actions.handleCloseNewLaboratory}
          onEditLaboratoryDialogChange={actions.handleCloseEditLaboratory}
          onSuccess={refetch}
        />
      </div>
    </PageContainer>
  );
}