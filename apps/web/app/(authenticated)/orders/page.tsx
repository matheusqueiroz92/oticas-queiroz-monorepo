"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, FileX, RefreshCw, Plus, Filter, Search, X } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { OrderExportButton } from "@/components/Orders/exports/OrderExportButton";
import { OrderFilters } from "@/components/Orders/OrderFilters";
import { OrdersList } from "@/components/Orders/OrdersList";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Order } from "@/app/types/order";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { PageTitle } from "@/components/PageTitle";
import { customBadgeStyles } from "@/app/utils/custom-badge-styles";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function OrdersPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { toast } = useToast();

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
    navigateToCreateOrder,
    refreshOrdersList,
    getClientName,
    getEmployeeName,
    getLaboratoryName,
    getStatusBadge,
    getPaymentStatusBadge,
  } = useOrders();
  
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrdersList();
      toast({
        title: "Atualizado",
        description: "Lista de pedidos atualizada com sucesso.",
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
    return count;
  };

  const handleClearSearch = () => {
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
      key: "employee", 
      header: "Vendedor",
      render: (order: Order) => getEmployeeName(order.employeeId.toString())
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

  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      
      <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
        <PageTitle
          title="Pedidos"
          description="Lista de pedidos da loja"
        />
        
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
              filters={filters}
              buttonText="Exportar"
              variant="outline"
              disabled={isLoading || orders.length === 0}
              size="sm"
            />
            <Button
              className="bg-[var(--primary-blue)] text-primary-foreground"
              onClick={navigateToCreateOrder}
              size="sm"
            >
                <Plus className="h-4 w-4 mr-1" />
              Novo Pedido
            </Button>
          </div>
        </div>

        {showFilters && (
          <OrderFilters 
            onUpdateFilters={(newFilters: Record<string, any>) => {
              updateFilters(newFilters);
            }} 
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
              Não há pedidos cadastrados ou nenhum corresponde aos filtros aplicados.
            </p>
            {(search || Object.keys(updateFilters).length > 1) && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="mt-4 mb-2"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={navigateToCreateOrder}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar Novo Pedido
            </Button>
          </div>
        )}

        {!isLoading && !error && orders.length > 0 && (
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
            key={`order-table-${search}-${JSON.stringify(orders.length)}-${currentPage}`}
          />
        )}
      </div>
    </>
  );
}