"use client";

import Cookies from "js-cookie";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileX, Plus, Clock, Settings, Box, Truck, XCircle } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
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
  ShoppingBag,
  Package,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderDialog } from "@/components/orders/OrderDialog";

export default function OrdersPage() {
  const [, setUserId] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderDialogMode, setOrderDialogMode] = useState<'create' | 'edit'>('create');
  const [orderToEdit, setOrderToEdit] = useState<any>(null);

  useEffect(() => {
    const id = Cookies.get("userId") || "";
    setUserId(id);
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
    setCurrentPage,
    updateFilters,
    navigateToOrderDetails,
    getClientName,
    getEmployeeName,
    getLaboratoryName,
    getStatusBadge,
    getPaymentStatusBadge,
  } = useOrders();

  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    return count;
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
  const totalOrdersLength = orders.length;
  
  const ordersToday = orders.filter(order => {
    const created = new Date(order.createdAt || order.orderDate);
    const today = new Date();
    return (
      created.getDate() === today.getDate() &&
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear()
    );
  }).length;
  
  const ordersInProduction = orders.filter(order => order.status === "in_production").length;
  
  const ordersReady = orders.filter(order => order.status === "ready").length;
  
  const totalOrdersMonth = orders.filter(order => {
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
              value={totalOrdersLength.toLocaleString()}
              icon={ShoppingBag}
              iconColor="text-blue-600 dark:text-blue-400"
              bgColor="bg-blue-100 dark:bg-blue-900"
              badge={{
                text: `+${ordersToday} hoje`,
                className: "bg-blue-500 text-white border-0"
              }}
            />

            <StatCard
              title="Em Produção"
              value={ordersInProduction}
              icon={Package}
              iconColor="text-orange-600 dark:text-orange-400"
              bgColor="bg-orange-100 dark:bg-orange-900"
              badge={{
                text: `${totalOrdersLength > 0 ? ((ordersInProduction / totalOrdersLength) * 100).toFixed(1) : 0}% do total`,
                className: "bg-orange-500 text-white border-0"
              }}
            />

            <StatCard
              title="Prontos"
              value={ordersReady}
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
              value={formatCurrency(totalOrdersMonth)}
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
              <Select value={filters.status || "todos"} onValueChange={value => updateFilters({ ...filters, status: value === "todos" ? undefined : value })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status do pedido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500" />Status do pedido</span>
                  </SelectItem>
                  <SelectItem value="pending">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500" />Pendente</span>
                  </SelectItem>
                  <SelectItem value="in_production">
                    <span className="flex items-center gap-2"><Settings className="w-4 h-4 text-orange-500" />Em produção</span>
                  </SelectItem>
                  <SelectItem value="ready">
                    <span className="flex items-center gap-2"><Box className="w-4 h-4 text-green-500" />Pronto</span>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-blue-500" />Entregue</span>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <span className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" />Cancelado</span>
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
              <Button size="sm" className="bg-[var(--primary-blue)] text-white" onClick={handleOpenNewOrder}>
                <Plus className="w-4 h-4 mr-2" /> Novo Pedido
              </Button>
            </ActionButtons>

            <AdvancedFilters>
              <OrderFilters 
                onUpdateFilters={(newFilters: Record<string, any>) => {
                  const merged = { ...filters, ...newFilters };
                  if (!('paymentMethod' in newFilters)) delete (merged as any).paymentMethod;
                  if (!('paymentStatus' in newFilters)) delete (merged as any).paymentStatus;
                  if (!('employeeId' in newFilters)) delete (merged as any).employeeId;
                  if (!('laboratoryId' in newFilters)) delete (merged as any).laboratoryId;
                  if (!('startDate' in newFilters)) delete (merged as any).startDate;
                  if (!('endDate' in newFilters)) delete (merged as any).endDate;
                  updateFilters(merged);
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