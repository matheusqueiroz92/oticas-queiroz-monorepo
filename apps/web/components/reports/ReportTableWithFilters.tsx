import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
import { ReportFilters } from "./ReportFilters";
import { ReportTableSection } from "./ReportTableSection";
import type { Report, ReportFormat } from "@/app/_types/report";
import { FileText, Filter } from "lucide-react";

interface ReportTableWithFiltersProps {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (search: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  filters: Record<string, any>;
  onUpdateFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  onNewReport: () => void;
  onDetailsClick: (reportId: string) => void;
  onDownloadClick: (report: Report, format: ReportFormat) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function ReportTableWithFilters({
  reports,
  isLoading,
  error,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  filters,
  onUpdateFilters,
  onClearFilters,
  onNewReport,
  onDetailsClick,
  onDownloadClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: ReportTableWithFiltersProps) {
  // Configuração dos filtros básicos
  const statusFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todos os status",
      icon: <Filter className="w-4 h-4 text-gray-500" />
    },
    {
      value: "completed",
      label: "Concluído",
      icon: <FileText className="w-4 h-4 text-green-500" />
    },
    {
      value: "pending",
      label: "Pendente",
      icon: <FileText className="w-4 h-4 text-yellow-500" />
    },
    {
      value: "processing",
      label: "Processando",
      icon: <FileText className="w-4 h-4 text-blue-500" />
    },
    {
      value: "error",
      label: "Com erro",
      icon: <FileText className="w-4 h-4 text-red-500" />
    }
  ];

  const handleStatusChange = (value: string) => {
    if (value === "todos") {
      onUpdateFilters({ status: undefined });
    } else {
      onUpdateFilters({ status: value });
    }
  };

  const basicFilters = [
    {
      options: statusFilterOptions,
      value: filters.status || "todos",
      onChange: handleStatusChange,
      placeholder: "Status do relatório",
      width: "w-[200px]"
    }
  ];

  return (
    <DataTableWithFilters
      title="Lista de Relatórios"
      searchPlaceholder="Buscar por nome do relatório"
      searchValue={search}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <ReportFilters onUpdateFilters={onUpdateFilters} />
      }
      onNewItem={onNewReport}
      newButtonText="Novo Relatório"
      newButtonIcon={<FileText className="w-4 h-4" />}
      onExport={() => {
        // Implementar lógica de exportação
      }}
      exportDisabled={isLoading || reports.length === 0}
    >
      <ReportTableSection
        reports={reports}
        isLoading={isLoading}
        error={error}
        search={search}
        activeFiltersCount={activeFiltersCount}
        onDetailsClick={onDetailsClick}
        onDownloadClick={onDownloadClick}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        limit={limit}
      />
    </DataTableWithFilters>
  );
} 