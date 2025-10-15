import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/profile/UserTable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ListPageContent } from "@/components/ui/list-page-header";
import { Loader2, UserX, Plus } from "lucide-react";
import { getEmployeeTableColumns } from "@/app/_utils/employee-table-config";
import type { User } from "@/app/_types/user";

interface EmployeeTableSectionProps {
  employees: User[];
  isLoading: boolean;
  error: string | null;
  search: string;
  activeFiltersCount: number;
  onDetailsClick: (employeeId: string) => void;
  onEditClick: (employee: User) => void;
  onNewEmployee: () => void;
  onClearFilters: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function EmployeeTableSection({
  employees,
  isLoading,
  error,
  search,
  activeFiltersCount,
  onDetailsClick,
  onEditClick,
  onNewEmployee,
  onClearFilters,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: EmployeeTableSectionProps) {
  const showEmptyState = !isLoading && !error && employees.length === 0;
  const columns = getEmployeeTableColumns();

  return (
    <ListPageContent>
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-6">
          <ErrorAlert message={error} />
        </div>
      )}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum funcionário encontrado</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {search || activeFiltersCount > 0 
              ? "Tente ajustar os filtros de busca." 
              : "Clique em 'Novo Funcionário' para adicionar um funcionário ao sistema."
            }
          </p>
          {(!search && activeFiltersCount === 0) && (
            <Button onClick={onNewEmployee}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
          )}
          {(search || activeFiltersCount > 0) && (
            <Button onClick={onClearFilters} variant="outline">
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && employees.length > 0 && (
        <div className="overflow-hidden">
          <UserTable
            data={employees}
            columns={columns}
            onDetailsClick={onDetailsClick}
            onEditClick={onEditClick}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            pageSize={limit}
          />
        </div>
      )}
    </ListPageContent>
  );
} 