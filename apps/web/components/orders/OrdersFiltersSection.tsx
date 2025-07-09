import { Button } from "@/components/ui/button";
import { Plus, Clock, Settings, Box, Truck, XCircle } from "lucide-react";
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

interface OrdersFiltersSectionProps {
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
}

export function OrdersFiltersSection({
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
}: OrdersFiltersSectionProps) {
  return (
    <ListPageHeader
      title="Lista de Pedidos"
      searchValue={search}
      searchPlaceholder="Buscar por cliente, CPF ou O.S."
      onSearchChange={onSearchChange}
      showFilters={showFilters}
      onToggleFilters={onToggleFilters}
      activeFiltersCount={activeFiltersCount}
    >
      <FilterSelects>
        <Select value={filters.status || "todos"} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status do pedido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Status do pedido
              </span>
            </SelectItem>
            <SelectItem value="pending">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Pendente
              </span>
            </SelectItem>
            <SelectItem value="in_production">
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-500" />
                Em produção
              </span>
            </SelectItem>
            <SelectItem value="ready">
              <span className="flex items-center gap-2">
                <Box className="w-4 h-4 text-green-500" />
                Pronto
              </span>
            </SelectItem>
            <SelectItem value="delivered">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                Entregue
              </span>
            </SelectItem>
            <SelectItem value="cancelled">
              <span className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Cancelado
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </FilterSelects>

      <ActionButtons>
        <OrderExportButton 
          filters={filters}
          buttonText="Exportar"
          variant="outline"
          disabled={isLoading || orders.length === 0}
          size="sm"
        />
        <Button size="sm" className="bg-[var(--primary-blue)] text-white" onClick={onOpenNewOrder}>
          <Plus className="w-4 h-4 mr-2" /> Novo Pedido
        </Button>
      </ActionButtons>

      <AdvancedFilters>
        <OrderFilters onUpdateFilters={onUpdateFilters} />
      </AdvancedFilters>
    </ListPageHeader>
  );
} 