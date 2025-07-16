import { CheckCircle, XCircle, Grid3X3 } from "lucide-react";
import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
import { LaboratoryFilters } from "@/components/laboratories/LaboratoryFilters";
import { LaboratoryTableSection } from "@/components/laboratories/LaboratoryTableSection";
import type { Laboratory } from "@/app/_types/laboratory";

interface LaboratoryTableWithFiltersProps {
  laboratories: Laboratory[];
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (search: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  filters: Record<string, any>;
  onUpdateFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  onNewLaboratory: () => void;
  onDetailsClick: (laboratoryId: string) => void;
  onEditClick: (laboratory: Laboratory) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function LaboratoryTableWithFilters({
  laboratories,
  isLoading,
  error,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  selectedStatus,
  onStatusChange,
  onUpdateFilters,
  onClearFilters,
  onNewLaboratory,
  onDetailsClick,
  onEditClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: LaboratoryTableWithFiltersProps) {
  // Configuração dos filtros básicos
  const statusFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todos os status",
      icon: <Grid3X3 className="w-4 h-4 text-gray-500" />
    },
    {
      value: "ativo",
      label: "Ativo",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      value: "inativo",
      label: "Inativo",
      icon: <XCircle className="w-4 h-4 text-red-500" />
    }
  ];

  const basicFilters = [
    {
      options: statusFilterOptions,
      value: selectedStatus,
      onChange: onStatusChange,
      placeholder: "Status",
      width: "w-[180px]"
    }
  ];

  return (
    <DataTableWithFilters
      title="Lista de Laboratórios"
      searchPlaceholder="Buscar por nome, email ou telefone"
      searchValue={search}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <LaboratoryFilters onUpdateFilters={onUpdateFilters} />
      }
      onNewItem={onNewLaboratory}
      newButtonText="Novo Laboratório"
      onExport={() => {
        // Implementar lógica de exportação
      }}
      exportDisabled={isLoading || laboratories.length === 0}
    >
      <LaboratoryTableSection
        laboratories={laboratories}
        isLoading={isLoading}
        error={error}
        search={search}
        activeFiltersCount={activeFiltersCount}
        onDetailsClick={onDetailsClick}
        onEditClick={onEditClick}
        onNewLaboratory={onNewLaboratory}
        onClearFilters={onClearFilters}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        limit={limit}
      />
    </DataTableWithFilters>
  );
} 