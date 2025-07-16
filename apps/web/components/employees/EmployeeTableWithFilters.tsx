import { TrendingUp } from "lucide-react";
import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { EmployeeTableSection } from "@/components/employees/EmployeeTableSection";
import type { User } from "@/app/_types/user";

interface EmployeeTableWithFiltersProps {
  employees: User[];
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
  onNewEmployee: () => void;
  onDetailsClick: (employeeId: string) => void;
  onEditClick: (employee: User) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function EmployeeTableWithFilters({
  employees,
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
  onNewEmployee,
  onDetailsClick,
  onEditClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: EmployeeTableWithFiltersProps) {
  // Configuração dos filtros básicos
  const salesRangeFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todas as faixas",
      icon: <TrendingUp className="w-4 h-4 text-gray-500" />
    },
    {
      value: "0",
      label: "Sem vendas",
      icon: <TrendingUp className="w-4 h-4 text-red-500" />
    },
    {
      value: "1+",
      label: "Com vendas",
      icon: <TrendingUp className="w-4 h-4 text-green-500" />
    },
    {
      value: "1-5",
      label: "1-5 vendas",
      icon: <TrendingUp className="w-4 h-4 text-blue-500" />
    },
    {
      value: "6-10",
      label: "6-10 vendas",
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />
    },
    {
      value: "10+",
      label: "10+ vendas",
      icon: <TrendingUp className="w-4 h-4 text-orange-500" />
    }
  ];

  const handleSalesRangeChange = (value: string) => {
    if (value === "todos") {
      onUpdateFilters({ sort: "name" });
    } else {
      onUpdateFilters({ salesRange: value, sort: "name" });
    }
  };

  const basicFilters = [
    {
      options: salesRangeFilterOptions,
      value: filters.salesRange || "todos",
      onChange: handleSalesRangeChange,
      placeholder: "Faixa de vendas",
      width: "w-[200px]"
    }
  ];

  return (
    <DataTableWithFilters
      title="Lista de Funcionários"
      searchPlaceholder="Buscar por nome, email ou CPF"
      searchValue={search}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <EmployeeFilters onUpdateFilters={onUpdateFilters} />
      }
      onNewItem={onNewEmployee}
      newButtonText="Novo Funcionário"
      onExport={() => {
        // Implementar lógica de exportação
      }}
      exportDisabled={isLoading || employees.length === 0}
    >
      <EmployeeTableSection
        employees={employees}
        isLoading={isLoading}
        error={error}
        search={search}
        activeFiltersCount={activeFiltersCount}
        onDetailsClick={onDetailsClick}
        onEditClick={onEditClick}
        onNewEmployee={onNewEmployee}
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