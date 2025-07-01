"use client";

import Cookies from "js-cookie";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, FileX, Plus, Filter, Search } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { StatCard } from "@/components/ui/StatCard";
import { OrderExportButton } from "@/components/orders/exports/OrderExportButton";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { PageContainer } from "@/components/ui/page-container";
import { OrdersList } from "@/components/orders/OrdersList";
import { ErrorAlert } from "@/components/ErrorAlert";
import { 
  ListPageHeader, 
  FilterSelects, 
  ActionButtons, 
  AdvancedFilters,
  ListPageContent 
} from "@/components/ui/list-page-header";
import { Order } from "@/app/_types/order";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { customBadgeStyles } from "@/app/_utils/custom-badge-styles";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShoppingBag,
  Package,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderDialog } from "@/components/orders/OrderDialog";

export default function OrdersPage() {
  const [userId, setUserId] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderDialogMode, setOrderDialogMode] = useState<'create' | 'edit'>('create');
  const [orderToEdit, setOrderToEdit] = useState<any>(null);

  useEffect(() => {
    const id = Cookies.get("userId") || "";
    setUserId(id);
  }, []);
  
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

  // Estatísticas para os cards
  const totalPedidos = orders.length;
  const pedidosHoje = orders.filter(order => {
    const created = new Date(order.createdAt || order.orderDate);
    const hoje = new Date();
    return (
      created.getDate() === hoje.getDate() &&
      created.getMonth() === hoje.getMonth() &&
      created.getFullYear() === hoje.getFullYear()
    );
  }).length;
  const emProducao = orders.filter(order => order.status === "in_production").length;
  const prontos = orders.filter(order => order.status === "ready").length;
  const totalMes = orders.filter(order => {
    const created = new Date(order.createdAt || order.orderDate);
    const hoje = new Date();
    return (
      created.getMonth() === hoje.getMonth() &&
      created.getFullYear() === hoje.getFullYear()
    );
  }).reduce((sum, order) => sum + (order.finalPrice || order.totalPrice), 0);

  // Substituir navegação por abertura do dialog
  const handleOpenNewOrder = () => {
    setOrderDialogMode('create');
    setOrderToEdit(null);
    setOrderDialogOpen(true);
  };
  
  const handleEditOrder = (order: any) => {
    setOrderDialogMode('edit');
    setOrderToEdit(order);
    setOrderDialogOpen(true);
  };

  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      
      <PageContainer>
        <div className="space-y-8">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total de Pedidos"
              value={totalPedidos.toLocaleString()}
              icon={ShoppingBag}
              iconColor="text-blue-600 dark:text-blue-400"
              bgColor="bg-blue-100 dark:bg-blue-900"
              badge={{
                text: `+${pedidosHoje} hoje`,
                className: "bg-blue-500 text-white border-0"
              }}
            />

            <StatCard
              title="Em Produção"
              value={emProducao}
              icon={Package}
              iconColor="text-orange-600 dark:text-orange-400"
              bgColor="bg-orange-100 dark:bg-orange-900"
              badge={{
                text: `${totalPedidos > 0 ? ((emProducao / totalPedidos) * 100).toFixed(1) : 0}% do total`,
                className: "bg-orange-500 text-white border-0"
              }}
            />

            <StatCard
              title="Prontos"
              value={prontos}
              icon={CheckCircle2}
              iconColor="text-green-600 dark:text-green-400"
              bgColor="bg-green-100 dark:bg-green-900"
              badge={{
                text: "Aguardando entrega",
                className: "bg-green-500 text-white border-0"
              }}
            />

            <StatCard
              title="Valor Total"
              value={formatCurrency(totalMes)}
              icon={DollarSign}
              iconColor="text-purple-600 dark:text-purple-400"
              bgColor="bg-purple-100 dark:bg-purple-900"
              badge={{
                text: "Este mês",
                className: "bg-purple-500 text-white border-0"
              }}
            />
          </div>

          {/* Filtros e Busca */}
          <ListPageHeader
            title="Lista de Pedidos"
            searchValue={search}
            searchPlaceholder="Buscar por cliente, CPF ou O.S."
            onSearchChange={setSearch}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((prev) => !prev)}
            activeFiltersCount={getActiveFiltersCount()}
          >
            <FilterSelects>
              <Select defaultValue="todos">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Status do pedido</SelectItem>
                  <SelectItem value="vip">Pendente</SelectItem>
                  <SelectItem value="vip">Em produção</SelectItem>
                  <SelectItem value="regular">Pronto</SelectItem>
                  <SelectItem value="regular">Entregue</SelectItem>
                  <SelectItem value="novo">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="todos-status">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos-status">Status do pagamento</SelectItem>
                  <SelectItem value="ativo">Pendente</SelectItem>
                  <SelectItem value="inativo">Parcialmente pago</SelectItem>
                  <SelectItem value="bloqueado">Pago</SelectItem>
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
              <Button size="sm" onClick={handleOpenNewOrder}>
                <Plus className="w-4 h-4 mr-2" /> Novo Pedido
              </Button>
            </ActionButtons>

            <AdvancedFilters>
              <OrderFilters 
                onUpdateFilters={(newFilters: Record<string, any>) => {
                  updateFilters(newFilters);
                }}
              />
            </AdvancedFilters>
          </ListPageHeader>

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
                  {search ? "Tente ajustar os filtros de busca." : "Clique em 'Novo Pedido' para adicionar um pedido ao sistema."}
                </p>
                {!search && (
                  <Button onClick={handleOpenNewOrder}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Pedido
                  </Button>
                )}
              </div>
            )}
            {!isLoading && !error && orders.length > 0 && (
              <div className="overflow-hidden">
                <OrdersList
                  data={orders}
                  columns={orderColumns}
                  onDetailsClick={navigateToOrderDetails}
                  onEditClick={handleEditOrder}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                  totalItems={totalOrders}
                  sortField="createdAt"
                  sortDirection="desc"
                  key={`order-table-${search}-${JSON.stringify(orders.length)}-${currentPage}`}
                />
              </div>
            )}
          </ListPageContent>
        </div>
      </PageContainer>
      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        order={orderToEdit}
        mode={orderDialogMode}
      />
    </>
  );
}