import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
import { LegacyClientFilters } from "./LegacyClientFilters";
import { LegacyClientTableSection } from "./LegacyClientTableSection";
import type { LegacyClient } from "@/app/_types/legacy-client";
import { Users, Filter } from "lucide-react";

interface LegacyClientTableWithFiltersProps {
  clients: LegacyClient[];
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
  onNewClient: () => void;
  onDetailsClick: (clientId: string) => void;
  onEditClick: (client: LegacyClient) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function LegacyClientTableWithFilters({
  clients,
  isLoading,
  error,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  filters,
  onUpdateFilters,
  onNewClient,
  onDetailsClick,
  onEditClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: LegacyClientTableWithFiltersProps) {
  // Configuração dos filtros básicos
  const statusFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todos os status",
      icon: <Filter className="w-4 h-4 text-gray-500" />
    },
    {
      value: "active",
      label: "Ativo",
      icon: <Users className="w-4 h-4 text-green-500" />
    },
    {
      value: "inactive",
      label: "Inativo",
      icon: <Users className="w-4 h-4 text-red-500" />
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
      placeholder: "Status do cliente",
      width: "w-[200px]"
    }
  ];

  return (
    <DataTableWithFilters
      title="Lista de Clientes Legados"
      searchPlaceholder="Buscar por nome ou CPF/CNPJ..."
      searchValue={search}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <LegacyClientFilters onUpdateFilters={onUpdateFilters} />
      }
      onNewItem={onNewClient}
      newButtonText="Novo Cliente"
      newButtonIcon={<Users className="w-4 h-4" />}
      onExport={() => {
        // Implementar lógica de exportação
      }}
      exportDisabled={isLoading || clients.length === 0}
    >
      <LegacyClientTableSection
        clients={clients}
        isLoading={isLoading}
        error={error}
        search={search}
        activeFiltersCount={activeFiltersCount}
        onDetailsClick={onDetailsClick}
        onEditClick={onEditClick}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        limit={limit}
      />
    </DataTableWithFilters>
  );
} 