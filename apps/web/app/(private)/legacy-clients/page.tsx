"use client";

import { PageContainer } from "@/components/ui/page-container";
import { LegacyClientStatsCards } from "@/components/legacy-clients/LegacyClientStatsCards";
import { LegacyClientTableWithFilters } from "@/components/legacy-clients/LegacyClientTableWithFilters";
import { LegacyClientDialogs } from "@/components/legacy-clients/LegacyClientDialogs";
import { useLegacyClients } from "@/hooks/legacy-clients/useLegacyClients";
import { useLegacyClientPageState } from "@/hooks/legacy-clients/useLegacyClientPageState";
import { useLegacyClientFilters } from "@/hooks/legacy-clients/useLegacyClientFilters";
import { useLegacyClientStats } from "@/hooks/legacy-clients/useLegacyClientStats";

export default function LegacyClientsPage() {
  const { state, actions } = useLegacyClientPageState();
  
  const {
    clients,
    isLoading,
    error,
    search,
    setSearch,
    navigateToLegacyClientDetails,
    currentPage,
    pageSize,
    totalPages,
    totalClients,
    setCurrentPage,
    refetch,
    filters,
    updateFilters,
    getActiveFiltersCount,
  } = useLegacyClients();

  const {
    handleUpdateFilters,
    handleClearAllFilters,
  } = useLegacyClientFilters({
    search,
    setSearch,
    filters,
    updateFilters,
    getActiveFiltersCount: getActiveFiltersCount(),
  });

  const stats = useLegacyClientStats(clients);

  // Limpar filtros incluindo os estados locais
  const handleClearFilters = () => {
    actions.resetFilters();
    handleClearAllFilters();
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <LegacyClientStatsCards
          totalClients={stats.totalClients}
          activeClients={stats.activeClients}
          inactiveClients={stats.inactiveClients}
          totalDebt={stats.totalDebt}
          averageDebt={stats.averageDebt}
          recentClients={stats.recentClients}
        />

        {/* Tabela de Clientes com Filtros */}
        <LegacyClientTableWithFilters
          clients={clients}
          isLoading={isLoading}
          error={error?.message || null}
          search={search}
          onSearchChange={setSearch}
          showFilters={state.showFilters}
          onToggleFilters={actions.toggleFilters}
          activeFiltersCount={getActiveFiltersCount()}
          filters={filters}
          onUpdateFilters={handleUpdateFilters}
          onClearFilters={handleClearFilters}
          onNewClient={actions.handleOpenNewClient}
          onDetailsClick={navigateToLegacyClientDetails}
          onEditClick={actions.handleEditClient}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalClients}
          limit={pageSize}
        />

        {/* Diálogos */}
        <LegacyClientDialogs
          newClientDialogOpen={state.newClientDialogOpen}
          clientToEdit={state.clientToEdit}
          onNewClientDialogChange={actions.handleCloseNewClient}
          onEditClientDialogChange={actions.handleCloseEditClient}
          onSuccess={refetch}
        />
      </div>
    </PageContainer>
  );
}