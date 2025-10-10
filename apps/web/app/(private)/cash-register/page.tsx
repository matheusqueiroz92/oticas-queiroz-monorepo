"use client";

import { useMemo } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { ActiveCashRegisterCard } from "@/components/cash-register/ActiveCashRegisterCard";
import { CashRegisterTableWithFilters } from "@/components/cash-register/CashRegisterTableWithFilters";
import { useCashRegister } from "@/hooks/cash-register/useCashRegister";
import { useCashRegisterPageState } from "@/hooks/cash-register/useCashRegisterPageState";

export default function CashRegisterPage() {
  const { state, actions } = useCashRegisterPageState();
  
  const {
    cashRegisters,
    activeRegister,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalRegisters,
    search,
    // date,
    setSearch,
    // setDate,
    setCurrentPage,
    // applyDateFilter,
    clearFilters,
    navigateToOpenRegister,
    navigateToRegisterDetails,
    navigateToCloseRegister,
  } = useCashRegister().useCashRegisterList();

  // Filtrar caixas localmente baseado nos filtros selecionados
  const filteredCashRegisters = useMemo(() => {
    let filtered = [...cashRegisters];

    // Filtro por status
    if (state.selectedStatus && state.selectedStatus !== "todos") {
      filtered = filtered.filter(register => register.status === state.selectedStatus);
    }

    return filtered;
  }, [cashRegisters, state.selectedStatus]);

  // Contar filtros ativos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    if (state.selectedStatus && state.selectedStatus !== "todos") count++;
    if (state.date) count++;
    return count;
  };

  // Limpar filtros
  const handleClearFilters = () => {
    actions.resetFilters();
    clearFilters();
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Card do Caixa Ativo */}
        {activeRegister && (
          <ActiveCashRegisterCard 
            register={activeRegister}
            onViewDetails={navigateToRegisterDetails}
            onCloseCashRegister={navigateToCloseRegister}
          />
        )}

        {/* Tabela de Caixas com Filtros */}
        <CashRegisterTableWithFilters
          cashRegisters={filteredCashRegisters}
          isLoading={isLoading}
          error={error}
          search={search}
          onSearchChange={setSearch}
          showFilters={state.showFilters}
          onToggleFilters={actions.toggleFilters}
          activeFiltersCount={getActiveFiltersCount()}
          selectedStatus={state.selectedStatus}
          onStatusChange={actions.setSelectedStatus}
          date={state.date}
          onDateChange={actions.setDate}
          onClearFilters={handleClearFilters}
          onOpenRegister={navigateToOpenRegister}
          onDetailsClick={navigateToRegisterDetails}
          onCloseClick={navigateToCloseRegister}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalRegisters}
          limit={cashRegisters.length}
          hasActiveRegister={!!activeRegister}
        />
      </div>
    </PageContainer>
  );
}