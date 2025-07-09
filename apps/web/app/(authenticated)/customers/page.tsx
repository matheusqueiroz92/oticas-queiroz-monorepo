"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { CustomerStatsCards } from "@/components/customers/CustomerStatsCards";
import { CustomerTableWithFilters } from "@/components/customers/CustomerTableWithFilters";
import { CustomerDialogs } from "@/components/customers/CustomerDialogs";
import { useCustomers } from "@/hooks/useCustomers";
import { useCustomerPageState } from "@/hooks/useCustomerPageState";
import { useCustomerFilters } from "@/hooks/useCustomerFilters";
import { useCustomerStats } from "@/hooks/useCustomerStats";

export default function CustomersPage() {
  const { state, actions } = useCustomerPageState();
  
  const {
    customers,
    isLoading,
    error,
    search,
    setSearch,
    navigateToCustomerDetails,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    totalCustomers,
    limit,
    refetch,
    filters,
    updateFilters,
    getActiveFiltersCount,
  } = useCustomers();

  const {
    handleUpdateFilters,
    handleClearAllFilters,
    applyBasicFilters,
  } = useCustomerFilters(search, setSearch, filters, updateFilters, getActiveFiltersCount);

  const stats = useCustomerStats(customers, totalCustomers);

  // Aplicar filtros quando os selects básicos mudarem
  useEffect(() => {
    applyBasicFilters(state.selectedCustomerType, state.selectedCategory);
  }, [state.selectedCustomerType, state.selectedCategory, applyBasicFilters]);

  // Limpar filtros incluindo os estados locais
  const handleClearFilters = () => {
    actions.resetFilters();
    handleClearAllFilters();
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <CustomerStatsCards
          totalCustomers={stats.totalCustomers}
          vipCustomers={stats.vipCustomers}
          newThisMonth={stats.newThisMonth}
          activeCustomers={stats.activeCustomers}
        />

        {/* Tabela de Clientes com Filtros */}
        <CustomerTableWithFilters
          customers={customers}
          isLoading={isLoading}
          error={error}
          search={search}
          onSearchChange={setSearch}
          showFilters={state.showFilters}
          onToggleFilters={actions.toggleFilters}
          activeFiltersCount={getActiveFiltersCount}
          selectedCategory={state.selectedCategory}
          onCategoryChange={actions.setSelectedCategory}
          filters={filters}
          onUpdateFilters={handleUpdateFilters}
          onClearFilters={handleClearFilters}
          onNewCustomer={actions.handleOpenNewCustomer}
          onDetailsClick={navigateToCustomerDetails}
          onEditClick={actions.handleEditCustomer}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          limit={limit}
        />

        {/* Diálogos */}
        <CustomerDialogs
          newCustomerDialogOpen={state.newCustomerDialogOpen}
          editCustomerDialogOpen={state.editCustomerDialogOpen}
          customerToEdit={state.customerToEdit}
          onNewCustomerDialogChange={actions.handleCloseNewCustomer}
          onEditCustomerDialogChange={actions.handleCloseEditCustomer}
          onSuccess={refetch}
        />
      </div>
    </PageContainer>
  );
}