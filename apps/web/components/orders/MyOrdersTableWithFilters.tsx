import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Plus, ShoppingCart, Clock, Settings, Box, Truck, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrderExportButton } from "@/components/orders/exports/OrderExportButton";
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
  loggedUserId,
  isEmployee,
  isCustomer,
  title,
}: MyOrdersTableWithFiltersProps) {
  // Para funcionários, mostrar filtros completos no card
  if (isEmployee) {
    return (
      <Card>
        <CardHeader className="bg-gray-100 dark:bg-slate-800/50">
          <CardTitle className="text-lg flex items-center gap-2">
            {title}
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:items-center">
            {/* Área esquerda: Input de busca e selects */}
            <div className="flex flex-1 flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Input
                  placeholder="Buscar por cliente, CPF ou O.S."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              
                             <Select value={filters.status || "all"} onValueChange={onStatusFilterChange}>
                 <SelectTrigger className="w-[180px]">
                   <SelectValue placeholder="Status do pedido" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">
                     <span className="flex items-center gap-2">
                       <Clock className="w-4 h-4 text-gray-500" />
                       Todos os Status
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
            </div>

            {/* Área direita: Botões de ação */}
            <div className="flex gap-2 justify-end sm:ml-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onToggleFilters}
                className={activeFiltersCount > 0 ? "bg-blue-50 border-blue-200" : ""}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avançados
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
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
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <OrderFilters 
            onUpdateFilters={onUpdateFilters}
            hideEmployeeFilter={isEmployee}
            hideClientFilter={isCustomer}
          />
        )}
        
        <CardContent className="p-0">
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
            isCustomer={isCustomer}
            isEmployee={isEmployee}
          />
        </CardContent>
      </Card>
    );
  }

  // Para clientes, mostrar apenas título simples fora do card
  return (
    <div>
      <div className="flex items-center gap-2 pb-4">
        <ShoppingCart className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
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
        isCustomer={isCustomer}
        isEmployee={isEmployee}
      />
    </div>
  );
} 