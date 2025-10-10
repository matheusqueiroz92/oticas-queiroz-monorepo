"use client";

import { PageContainer } from "@/components/ui/page-container";
import { EmployeeStatsCards } from "@/components/employees/EmployeeStatsCards";
import { EmployeeTableWithFilters } from "@/components/employees/EmployeeTableWithFilters";
import { EmployeeDialogs } from "@/components/employees/EmployeeDialogs";
import { useEmployees } from "@/hooks/employees/useEmployees";
import { useEmployeePageState } from "@/hooks/employees/useEmployeePageState";
import { useEmployeeFilters } from "@/hooks/employees/useEmployeeFilters";
import { useEmployeeStats } from "@/hooks/employees/useEmployeeStats";

export default function EmployeesPage() {
  const { state, actions } = useEmployeePageState();
  
  const {
    employees,
    isLoading,
    error,
    search,
    setSearch,
    navigateToEmployeeDetails,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    limit,
    refetch,
    filters,
    updateFilters,
    getActiveFiltersCount,
  } = useEmployees();



  const {
    handleUpdateFilters,
    handleClearAllFilters,
  } = useEmployeeFilters(search, setSearch, filters, updateFilters, getActiveFiltersCount);

  const stats = useEmployeeStats(employees, totalItems);

  // Limpar filtros incluindo os estados locais
  const handleClearFilters = () => {
    actions.resetFilters();
    handleClearAllFilters();
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <EmployeeStatsCards
          totalEmployees={stats.totalEmployees}
          topEmployees={stats.topEmployees}
          newThisMonth={stats.newThisMonth}
          activeEmployees={stats.activeEmployees}
          totalSales={stats.totalSales}
          totalRevenue={stats.totalRevenue}
        />

        {/* Tabela de Funcionários com Filtros */}
        <EmployeeTableWithFilters
          employees={employees}
          isLoading={isLoading}
          error={error}
          search={search}
          onSearchChange={setSearch}
          showFilters={state.showFilters}
          onToggleFilters={actions.toggleFilters}
          activeFiltersCount={getActiveFiltersCount}
          filters={filters}
          onUpdateFilters={handleUpdateFilters}
          onClearFilters={handleClearFilters}
          onNewEmployee={actions.handleOpenNewEmployee}
          onDetailsClick={navigateToEmployeeDetails}
          onEditClick={actions.handleEditEmployee}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          limit={limit}
        />

        {/* Diálogos */}
        <EmployeeDialogs
          newEmployeeDialogOpen={state.newEmployeeDialogOpen}
          editEmployeeDialogOpen={state.editEmployeeDialogOpen}
          employeeToEdit={state.employeeToEdit}
          onNewEmployeeDialogChange={actions.handleCloseNewEmployee}
          onEditEmployeeDialogChange={actions.handleCloseEditEmployee}
          onSuccess={refetch}
        />
      </div>
    </PageContainer>
  );
}