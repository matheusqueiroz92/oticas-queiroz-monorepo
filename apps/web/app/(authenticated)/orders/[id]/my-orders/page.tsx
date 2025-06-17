"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, FileX, RefreshCw, Filter, Search, X, User } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { OrderExportButton } from "@/components/orders/exports/OrderExportButton";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrdersList } from "@/components/orders/OrdersList";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Order } from "@/app/_types/order";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { PageTitle } from "@/components/ui/page-title";
import { customBadgeStyles } from "@/app/_utils/custom-badge-styles";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Cookies from "js-cookie";

export default function MyOrdersPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loggedEmployeeId, setLoggedEmployeeId] = useState<string>("");
  const [loggedEmployeeName, setLoggedEmployeeName] = useState<string>("");
  
  const { toast } = useToast();

  // Carregar dados do funcionário logado
  useEffect(() => {
    const userId = Cookies.get("userId");
    const userName = Cookies.get("name");
    
    if (userId) {
      setLoggedEmployeeId(userId);
    }
    if (userName) {
      setLoggedEmployeeName(userName);
    }
  }, []);

  const {
    orders,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalOrders,
    search,
    filters,
    setSearch,
    clearFilters,
    setCurrentPage,
    updateFilters,
    navigateToOrderDetails,
    navigateToEditOrder,
    refreshOrdersList,
    getClientName,
    getEmployeeName,
    getLaboratoryName,
    getStatusBadge,
    getPaymentStatusBadge,
  } = useOrders();

  // Aplicar filtro automático pelo funcionário logado
  useEffect(() => {
    if (loggedEmployeeId && (!filters.employeeId || filters.employeeId !== loggedEmployeeId)) {
      updateFilters({
        ...filters,
        employeeId: loggedEmployeeId
      });
    }
  }, [loggedEmployeeId, filters, updateFilters]);
  
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrdersList();
      toast({
        title: "Atualizado",
        description: "Lista de seus pedidos atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar lista:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar lista de pedidos.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    // Não contar o filtro do employeeId pois é automático
    if (filters.status && filters.status !== 'all') count++;
    if (filters.paymentMethod && filters.paymentMethod !== 'all') count++;
    if (filters.laboratoryId && filters.laboratoryId !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  };

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleClearFilters = () => {
    // Manter o filtro do funcionário e limpar os outros
    const newFilters = {
      employeeId: loggedEmployeeId,
      sort: "-createdAt"
    };
    updateFilters(newFilters);
    setSearch('');
  };

  const showEmptyState = !isLoading && !error && orders.length === 0;

  const orderColumns = [
    { 
      key: "serviceOrder", 
      header: "O.S.",
      render: (order: Order) => (order.serviceOrder ? order.serviceOrder : "Sem O.S.")
    },
    { 
      key: "client", 
      header: "Cliente",
      render: (order: Order) => getClientName(order.clientId.toString())
    },
    { 
      key: "date", 
      header: "Data",
      render: (order: Order) => formatDate(order.createdAt)
    },
    { 
      key: "status", 
      header: "Status Pedido",
      render: (order: Order) => {
        const statusInfo = getStatusBadge(order.status);
        return (
          <Badge className={`status-badge ${statusInfo.className}`}>
            {statusInfo.label}
          </Badge>
        );
      }
    },
    { 
      key: "laboratory", 
      header: "Laboratório",
      render: (order: Order) => order.laboratoryId 
        ? getLaboratoryName(order.laboratoryId.toString()) 
        : "N/A"
    },
    { 
      key: "total", 
      header: "Total",
      render: (order: Order) => formatCurrency(order.finalPrice || order.totalPrice)
    },
    { 
      key: "paymentStatus",
      header: "Status Pagamento", 
      render: (order: Order) => {
        const statusInfo = getPaymentStatusBadge(order.paymentStatus);
        return (
          <Badge className={`status-badge ${statusInfo.className}`}>
            {statusInfo.label}
          </Badge>
        );
      }
    },
  ];

  // Filtros customizados para a página de pedidos do funcionário
  const handleUpdateFilters = (newFilters: Record<string, any>) => {
    // Sempre manter o filtro do funcionário logado
    const filtersWithEmployee = {
      ...newFilters,
      employeeId: loggedEmployeeId
    };
    updateFilters(filtersWithEmployee);
  };

  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      
      <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
        <div className="flex items-center justify-between">
          <PageTitle
            title="Meus Pedidos"
            description={`Pedidos realizados por ${loggedEmployeeName || 'você'}`}
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 font-medium">Vendedor: {loggedEmployeeName}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="relative w-full max-w-md">
              <Input
                placeholder="Buscar por cliente, CPF ou O.S."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 w-full"
                size={50}
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              
              {search && (
                <button 
                  onClick={handleClearSearch}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs">?</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Você pode buscar por:</p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>Nome do cliente</li>
                      <li>CPF do cliente (11 dígitos)</li>
                      <li>Número da O.S. (4 a 7 dígitos)</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <Button 
              variant={showFilters ? "default" : "outline"}
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 text-xs rounded-full p-0 flex items-center justify-center">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <OrderExportButton 
              filters={{...filters, employeeId: loggedEmployeeId}}
              buttonText="Exportar"
              variant="outline"
              disabled={isLoading || orders.length === 0}
              size="sm"
            />
          </div>
        </div>

        {showFilters && (
          <OrderFilters 
            onUpdateFilters={handleUpdateFilters}
            hideEmployeeFilter={true} // Esconder o filtro de funcionário já que é automático
          />
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {error && <ErrorAlert message={error} />}

        {showEmptyState && (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
            <FileX className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mt-2">
              Você ainda não realizou nenhum pedido ou nenhum corresponde aos filtros aplicados.
            </p>
            {(search || getActiveFiltersCount() > 0) && (
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="mt-4"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>
        )}

        {!isLoading && !error && orders.length > 0 && (
          <>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">
                    Mostrando {orders.length} de {totalOrders} pedidos seus
                  </span>
                </div>
                <span className="text-green-600">
                  Total vendido: {formatCurrency(
                    orders.reduce((sum, order) => sum + (order.finalPrice || order.totalPrice), 0)
                  )}
                </span>
              </div>
            </div>

            <OrdersList
              data={orders}
              columns={orderColumns}
              onDetailsClick={navigateToOrderDetails}
              onEditClick={navigateToEditOrder}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              totalItems={totalOrders}
              sortField="createdAt"
              sortDirection="desc"
              key={`my-orders-table-${search}-${JSON.stringify(orders.length)}-${currentPage}`}
            />
          </>
        )}
      </div>
    </>
  );
}