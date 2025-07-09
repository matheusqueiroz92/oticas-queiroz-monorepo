import { Button } from "@/components/ui/button";
import { Loader2, FileX, X } from "lucide-react";
import { OrdersList } from "@/components/orders/OrdersList";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ListPageContent } from "@/components/ui/list-page-header";
import type { Order } from "@/app/_types/order";

interface MyOrdersContentProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  search: string;
  showEmptyState: boolean;
  orderColumns: any[];
  onDetailsClick: (orderId: string) => void;
  onEditClick: (order: any) => void;
  onClearFilters: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalOrders: number;
  activeFiltersCount: number;
  isCustomer: boolean;
  isEmployee: boolean;
}

export function MyOrdersContent({
  orders,
  isLoading,
  error,
  search,
  showEmptyState,
  orderColumns,
  onDetailsClick,
  onEditClick,
  onClearFilters,
  currentPage,
  totalPages,
  setCurrentPage,
  totalOrders,
  activeFiltersCount,
  isCustomer,
  isEmployee,
}: MyOrdersContentProps) {
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
          <FileX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {isCustomer 
              ? "Você ainda não possui pedidos ou nenhum corresponde aos filtros aplicados."
              : "Você ainda não registrou pedidos ou nenhum corresponde aos filtros aplicados."
            }
          </p>
          {(search || activeFiltersCount > 0) && (
            <Button variant="outline" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <div className="overflow-hidden">
          <OrdersList
            data={orders}
            columns={orderColumns}
            onDetailsClick={onDetailsClick}
            onEditClick={onEditClick}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalItems={totalOrders}
            sortField="createdAt"
            sortDirection="desc"
            hideEditButton={isCustomer}
            key={`my-orders-table-${search}-${JSON.stringify(orders.length)}-${currentPage}`}
          />
        </div>
      )}
    </ListPageContent>
  );
} 