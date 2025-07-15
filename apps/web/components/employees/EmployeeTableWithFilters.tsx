import { Crown, User as UserIcon, Grid3X3 } from "lucide-react";
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
  selectedRole: string;
  onRoleChange: (role: string) => void;
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
  selectedRole,
  onRoleChange,
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
  const roleFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todas as funções",
      icon: <Grid3X3 className="w-4 h-4 text-gray-500" />
    },
    {
      value: "admin",
      label: "Administrador",
      icon: <Crown className="w-4 h-4 text-purple-500" />
    },
    {
      value: "employee",
      label: "Funcionário",
      icon: <UserIcon className="w-4 h-4 text-blue-500" />
    }
  ];

  const basicFilters = [
    {
      options: roleFilterOptions,
      value: selectedRole,
      onChange: onRoleChange,
      placeholder: "Função",
      width: "w-[210px]"
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