"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, FileX, RefreshCw, Download, Plus, Filter } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { exportToPDF } from "@/app/utils/exportToPdf";
import { OrderFilters } from "@/components/Orders/OrderFilters";
import { OrderTable } from "@/components/Orders/OrderTable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Order } from "@/app/types/order";
import { formatCurrency, formatDate } from "@/app/utils/formatters";

// Estilos para as badges de status para impedir comportamento hover
const customBadgeStyles = `
  .status-badge {
    cursor: default;
    pointer-events: none;
  }
`;

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const { toast } = useToast();

  const {
    orders,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalOrders,
    setCurrentPage,
    updateFilters,
    navigateToOrderDetails,
    navigateToCreateOrder,
    refreshOrdersList,
    getClientName,
    getEmployeeName,
    getLaboratoryName
  } = useOrders();

  // Função debounce melhorada para a busca
  const debouncedSearch = useMemo(
    () => {
      const handler = (value: string) => {
        console.log("Executando busca para:", value);
        if (value.trim() === "") {
          updateFilters({});
        } else {
          updateFilters({ search: value });
        }
      };
      
      const debounced = (value: string) => {
        const timer = setTimeout(() => {
          handler(value);
        }, 300);
        
        return () => {
          clearTimeout(timer);
        };
      };
      
      return debounced;
    },
    [updateFilters]
  );

  // Aplicar busca quando o valor mudar
  useEffect(() => {
    const cleanup = debouncedSearch(search);
    return cleanup;
  }, [search, debouncedSearch]);

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

  const handleExportToPDF = async () => {
    setIsExporting(true);
    try {
      const exportData = orders.map(order => ({
        cliente: getClientName(order.clientId.toString()),
        data: formatDate(order.createdAt),
        status: getStatusBadge(order.status).label,
        vendedor: getEmployeeName(order.employeeId.toString()),
        laboratório: order.laboratoryId ? getLaboratoryName(order.laboratoryId.toString()) : "N/A",
        total: formatCurrency(order.finalPrice || order.totalPrice)
      }));

      await exportToPDF(exportData, 'pedidos-filtrados.pdf', 'Pedidos Filtrados');
      
      toast({
        title: "Exportação concluída",
        description: "Os pedidos foram exportados com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao exportar os pedidos.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Pendente",
        className: "bg-yellow-100 text-yellow-800",
      },
      in_production: {
        label: "Em Produção",
        className: "bg-blue-100 text-blue-800",
      },
      ready: { 
        label: "Pronto", 
        className: "bg-green-100 text-green-800" 
      },
      delivered: {
        label: "Entregue",
        className: "bg-purple-100 text-purple-800",
      },
      cancelled: {
        label: "Cancelado",
        className: "bg-red-100 text-red-800",
      },
    };

    return statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    return count;
  };

  // Verificar se não há pedidos para mostrar
  const showEmptyState = !isLoading && !error && orders.length === 0;

  const orderColumns = [
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
      header: "Status",
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
  ];

  return (
    <>
      {/* CSS personalizado para as badges de status */}
      <style jsx global>{customBadgeStyles}</style>
      
      <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
        <h1 className="text-2xl font-bold text-primary">Pedidos</h1>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Buscar pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            
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
            <Button 
              variant="outline"
              onClick={handleExportToPDF}
              disabled={isExporting || isLoading || orders.length === 0}
              size="sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
            <Button onClick={navigateToCreateOrder}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Pedido
            </Button>
          </div>
        </div>

        {/* Componente de filtros */}
        {showFilters && <OrderFilters onUpdateFilters={updateFilters} />}

        {/* Estado de Carregamento */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Estado de Erro */}
        {error && <ErrorAlert message={error} />}

        {/* Estado Vazio */}
        {showEmptyState && (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
            <FileX className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mt-2">
              Não há pedidos cadastrados ou nenhum corresponde aos filtros aplicados.
            </p>
            <Button 
              variant="outline" 
              onClick={navigateToCreateOrder}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar Novo Pedido
            </Button>
          </div>
        )}

        {/* Estado com Dados */}
        {!isLoading && !error && orders.length > 0 && (
          <OrderTable
            data={orders}
            columns={orderColumns}
            onDetailsClick={navigateToOrderDetails}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalItems={totalOrders}
            key={`order-table-${search}-${JSON.stringify(orders.length)}-${currentPage}`} // Key para forçar atualização
          />
        )}
        
        {/* Debug: Estado atual da tabela (apenas em desenvolvimento) */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="text-xs bg-gray-100 p-2 mt-2 rounded">
            Debug: {orders.length} pedidos | Página {currentPage}/{totalPages} | Total: {totalOrders}
          </div>
        )}
      </div>
    </>
  );
}