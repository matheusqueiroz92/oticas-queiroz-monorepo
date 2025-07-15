import { Clock, Settings, Box, Truck, XCircle } from "lucide-react";
import { DataTableWithFilters, FilterOption } from "@/components/ui/data-table-with-filters";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { MyOrdersContent } from "@/components/orders/MyOrdersContent";
import type { Order } from "@/app/_types/order";

interface MyOrdersTableWithFiltersProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (search: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  filters: Record<string, any>;
  onStatusFilterChange: (value: string) => void;
  onUpdateFilters: (filters: Record<string, any>) => void;
  onOpenNewOrder: () => void;
  orderColumns: any[];
  onDetailsClick: (orderId: string) => void;
  onEditClick: (order: any) => void;
  onClearFilters: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalOrders: number;
  showEmptyState: boolean;
  loggedUserId: string;
  isEmployee: boolean;
  isCustomer: boolean;
  title: string;
}

export function MyOrdersTableWithFilters({
  orders,
  isLoading,
  error,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  filters,
  onStatusFilterChange,
  onUpdateFilters,
  onOpenNewOrder,
  orderColumns,
  onDetailsClick,
  onEditClick,
  onClearFilters,
  currentPage,
  totalPages,
  setCurrentPage,
  totalOrders,
  showEmptyState,
  isEmployee,
  isCustomer,
  title,
}: MyOrdersTableWithFiltersProps) {
  // Configuração dos filtros básicos
  const statusFilterOptions: FilterOption[] = [
    {
      value: "todos",
      label: "Todos os Status",
      icon: <Clock className="w-4 h-4 text-gray-500" />
    },
    {
      value: "pending",
      label: "Pendente",
      icon: <Clock className="w-4 h-4 text-yellow-500" />
    },
    {
      value: "in_production",
      label: "Em produção",
      icon: <Settings className="w-4 h-4 text-orange-500" />
    },
    {
      value: "ready",
      label: "Pronto",
      icon: <Box className="w-4 h-4 text-green-500" />
    },
    {
      value: "delivered",
      label: "Entregue",
      icon: <Truck className="w-4 h-4 text-blue-500" />
    },
    {
      value: "cancelled",
      label: "Cancelado",
      icon: <XCircle className="w-4 h-4 text-red-500" />
    }
  ];

  const basicFilters = [
    {
      options: statusFilterOptions,
      value: filters.status || "todos",
      onChange: onStatusFilterChange,
      placeholder: "Status do pedido",
      width: "w-[180px]"
    }
  ];

  // Título customizado baseado no tipo de usuário
  const customTitle = isEmployee ? `${title} (Funcionário)` : title;

  return (
    <DataTableWithFilters
      title={customTitle}
      searchPlaceholder="Buscar por cliente, CPF ou O.S."
      searchValue={search}
      onSearchChange={onSearchChange}
      basicFilters={basicFilters}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
      advancedFiltersComponent={
        <OrderFilters onUpdateFilters={onUpdateFilters} />
      }
      onNewItem={onOpenNewOrder}
      newButtonText="Novo Pedido"
      onExport={() => {
        // Implementar lógica de exportação
      }}
      exportDisabled={isLoading || orders.length === 0}
    >
      <MyOrdersContent
        orders={orders}
        isLoading={isLoading}
        error={error}
        search={search}
        showEmptyState={showEmptyState}
        orderColumns={orderColumns}
        onDetailsClick={onDetailsClick}
        onEditClick={onEditClick}
        onClearFilters={onClearFilters}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        totalOrders={totalOrders}
        activeFiltersCount={activeFiltersCount}
        isEmployee={isEmployee}
        isCustomer={isCustomer}
      />
    </DataTableWithFilters>
  );
} 