import { Button } from "@/components/ui/button";
import { User, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderExportButton } from "@/components/orders/exports/OrderExportButton";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { 
  ListPageHeader, 
  FilterSelects, 
  ActionButtons, 
  AdvancedFilters 
} from "@/components/ui/list-page-header";
import type { Order } from "@/app/_types/order";

interface MyOrdersFiltersSectionProps {
  title: React.ReactNode;
  search: string;
  onSearchChange: (search: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  filters: Record<string, any>;
  onStatusFilterChange: (value: string) => void;
  onUpdateFilters: (filters: Record<string, any>) => void;
  onOpenNewOrder: () => void;
  orders: Order[];
  isLoading: boolean;
  loggedUserId: string;
  isEmployee: boolean;
  isCustomer: boolean;
}

export function MyOrdersFiltersSection({
  title,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  filters,
  onStatusFilterChange,
  onUpdateFilters,
  onOpenNewOrder,
  orders,
  isLoading,
  loggedUserId,
  isEmployee,
  isCustomer,
}: MyOrdersFiltersSectionProps) {
  // Para funcionários, mostrar filtros completos
  if (isEmployee) {
    return (
      <ListPageHeader
        title={title}
        searchValue={search}
        searchPlaceholder="Buscar por cliente, CPF ou O.S."
        onSearchChange={onSearchChange}
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        activeFiltersCount={activeFiltersCount}
      >
        <FilterSelects>
          <Select value={filters.status || "all"} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status do pedido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_production">Em produção</SelectItem>
              <SelectItem value="ready">Pronto</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </FilterSelects>

        <ActionButtons>
          <OrderExportButton 
            filters={{employeeId: loggedUserId}}
            buttonText="Exportar"
            variant="outline"
            disabled={isLoading || orders.length === 0}
            size="sm"
          />
          <Button size="sm" onClick={onOpenNewOrder}>
            <Plus className="w-4 h-4 mr-2" /> Novo Pedido
          </Button>
        </ActionButtons>

        <AdvancedFilters>
          <OrderFilters 
            onUpdateFilters={onUpdateFilters}
            hideEmployeeFilter={isEmployee}
            hideClientFilter={isCustomer}
          />
        </AdvancedFilters>
      </ListPageHeader>
    );
  }

  // Para clientes, mostrar apenas título simples
  return null;
} 