"use client";

import { useMemo } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { InstitutionStatsCards } from "@/components/institutions/InstitutionStatsCards";
import { InstitutionTableWithFilters } from "@/components/institutions/InstitutionTableWithFilters";
import { InstitutionDialogs } from "@/components/institutions/InstitutionDialogs";
import { useInstitutions } from "@/hooks/useInstitutions";
import { useInstitutionPageState } from "@/hooks/institutions/useInstitutionPageState";
import { useInstitutionStats } from "@/hooks/institutions/useInstitutionStats";

export default function InstitutionsPage() {
  const { state, actions } = useInstitutionPageState();
  
  const {
    institutions,
    isLoading,
    error,
    search,
    setSearch,
    navigateToInstitutionDetails,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    limit,
    refetch,
  } = useInstitutions();

  const stats = useInstitutionStats(institutions);

  // Filtrar instituições localmente baseado nos filtros selecionados
  const filteredInstitutions = useMemo(() => {
    let filtered = [...institutions];

    // Filtro por status
    if (state.selectedStatus && state.selectedStatus !== "todos") {
      filtered = filtered.filter(inst => inst.status === state.selectedStatus);
    }

    // Filtro por tipo de indústria
    if (state.selectedIndustryType && state.selectedIndustryType !== "todos") {
      filtered = filtered.filter(inst => inst.industryType === state.selectedIndustryType);
    }

    return filtered;
  }, [institutions, state.selectedStatus, state.selectedIndustryType]);

  // Contar filtros ativos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    if (state.selectedStatus && state.selectedStatus !== "todos") count++;
    if (state.selectedIndustryType && state.selectedIndustryType !== "todos") count++;
    return count;
  };

  // Limpar filtros
  const handleClearFilters = () => {
    actions.resetFilters();
    setSearch("");
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <InstitutionStatsCards
          totalInstitutions={stats.totalInstitutions}
          activeInstitutions={stats.activeInstitutions}
          inactiveInstitutions={stats.inactiveInstitutions}
          institutionsWithContact={stats.institutionsWithContact}
          institutionsWithImage={stats.institutionsWithImage}
          averageInstitutionsPerMonth={stats.averageInstitutionsPerMonth}
        />

        {/* Tabela de Instituições com Filtros */}
        <InstitutionTableWithFilters
          institutions={filteredInstitutions}
          isLoading={isLoading}
          error={error}
          search={search}
          onSearchChange={setSearch}
          showFilters={state.showFilters}
          onToggleFilters={actions.toggleFilters}
          activeFiltersCount={getActiveFiltersCount()}
          selectedStatus={state.selectedStatus}
          onStatusChange={actions.setSelectedStatus}
          selectedIndustryType={state.selectedIndustryType}
          onIndustryTypeChange={actions.setSelectedIndustryType}
          onClearFilters={handleClearFilters}
          onNewInstitution={actions.handleOpenNewDialog}
          onDetailsClick={navigateToInstitutionDetails}
          onEditClick={actions.handleEditInstitution}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          limit={limit}
        />

        {/* Diálogos */}
        <InstitutionDialogs
          newInstitutionDialogOpen={state.newInstitutionDialogOpen}
          institutionToEdit={state.institutionToEdit}
          onNewInstitutionDialogChange={actions.handleCloseNewDialog}
          onEditInstitutionDialogChange={actions.handleCloseEditDialog}
          onSuccess={refetch}
        />
      </div>
    </PageContainer>
  );
}