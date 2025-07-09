import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/profile/UserTable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ListPageContent } from "@/components/ui/list-page-header";
import { Loader2, UserX, Plus } from "lucide-react";
import { getCustomerTableColumns } from "@/app/_utils/customer-table-config";
import type { User } from "@/app/_types/user";

interface CustomerTableSectionProps {
  customers: User[];
  isLoading: boolean;
  error: string | null;
  search: string;
  activeFiltersCount: number;
  onDetailsClick: (id: string) => void;
  onEditClick: (customer: User) => void;
  onNewCustomer: () => void;
  onClearFilters: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  limit: number;
}

export function CustomerTableSection({
  customers,
  isLoading,
  error,
  search,
  activeFiltersCount,
  onDetailsClick,
  onEditClick,
  onNewCustomer,
  onClearFilters,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  limit,
}: CustomerTableSectionProps) {
  const showEmptyState = !isLoading && !error && customers.length === 0;
  const columns = getCustomerTableColumns();

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
          <h3 className="text-lg font-semibold">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {search || activeFiltersCount > 0 
              ? "Tente ajustar os filtros de busca." 
              : "Clique em 'Novo Cliente' para adicionar um cliente ao sistema."
            }
          </p>
          {(!search && activeFiltersCount === 0) && (
            <Button onClick={onNewCustomer}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          )}
          {(search || activeFiltersCount > 0) && (
            <Button onClick={onClearFilters} variant="outline">
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && customers.length > 0 && (
        <div className="overflow-hidden">
          <UserTable
            data={customers}
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