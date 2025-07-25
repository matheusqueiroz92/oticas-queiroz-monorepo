"use client";

import { PageContainer } from "@/components/ui/page-container";
import { ReportStatsCards } from "@/components/reports/ReportStatsCards";
import { ReportTableWithFilters } from "@/components/reports/ReportTableWithFilters";
import { ReportDialogs } from "@/components/reports/ReportDialogs";
import { useReports } from "@/hooks/reports/useReports";
import { useReportPageState } from "@/hooks/reports/useReportPageState";
import { useReportFilters } from "@/hooks/reports/useReportFilters";
import { useReportStats } from "@/hooks/reports/useReportStats";
import type { Report, ReportFormat } from "@/app/_types/report";

export default function ReportsPage() {
  const { state, actions } = useReportPageState();
  
  const {
    reports,
    isLoading,
    error,
    search,
    setSearch,
    navigateToReportDetails,
    currentPage,
    pageSize,
    totalPages,
    totalReports,
    setCurrentPage,
    refetch,
    filters,
    updateFilters,
    getActiveFiltersCount,
    handleDownloadReport,
  } = useReports();

  const {
    handleUpdateFilters,
    handleClearAllFilters,
  } = useReportFilters({
    search,
    setSearch,
    filters,
    updateFilters,
    getActiveFiltersCount,
  });

  const stats = useReportStats(reports);

  // Limpar filtros incluindo os estados locais
  const handleClearFilters = () => {
    actions.resetFilters();
    handleClearAllFilters();
  };

  // Handler para passar o formato corretamente
  const handleDownload = (report: Report, format: ReportFormat) => {
    handleDownloadReport(report._id, format);
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <ReportStatsCards
          totalReports={stats.totalReports}
          completedReports={stats.completedReports}
          pendingReports={stats.pendingReports}
          processingReports={stats.processingReports}
          errorReports={stats.errorReports}
          recentReports={stats.recentReports}
        />

        {/* Tabela de Relatórios com Filtros */}
        <ReportTableWithFilters
          reports={reports}
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
          onNewReport={actions.handleOpenNewReport}
          onDetailsClick={navigateToReportDetails}
          onDownloadClick={handleDownload}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalReports}
          limit={pageSize}
        />

        {/* Diálogos */}
        <ReportDialogs
          newReportDialogOpen={state.newReportDialogOpen}
          reportToEdit={state.reportToEdit}
          onNewReportDialogChange={actions.handleCloseNewReport}
          onEditReportDialogChange={actions.handleCloseEditReport}
          onSuccess={refetch}
        />
      </div>
    </PageContainer>
  );
}
