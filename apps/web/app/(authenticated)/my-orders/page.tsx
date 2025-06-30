"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileX, X, User, ShoppingCart, Plus } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";

import { OrderExportButton } from "@/components/orders/exports/OrderExportButton";
import { OrderFilters } from "@/components/orders/OrderFilters";
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
import { PageContainer } from "@/components/ui/page-container";
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
import Cookies from "js-cookie";
import { OrderDialog } from "@/components/orders/OrderDialog";

export default function MyOrdersPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [loggedUserId, setLoggedUserId] = useState<string>("");
  const [loggedUserName, setLoggedUserName] = useState<string>("");
  const [loggedUserRole, setLoggedUserRole] = useState<string>("");
  const [orderDialogMode, setOrderDialogMode] = useState<"create" | "edit">("create");
  const [orderToEdit, setOrderToEdit] = useState<any>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);  

  // Carregar dados do usuário logado
  useEffect(() => {
    const userId = Cookies.get("userId");
    const userName = Cookies.get("name");
    const userRole = Cookies.get("role");
    
    if (userId) {
      setLoggedUserId(userId);
    }
    if (userName) {
      setLoggedUserName(userName);
    }
    if (userRole) {
      setLoggedUserRole(userRole);
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
    setCurrentPage,
    updateFilters,
    navigateToOrderDetails,
    getClientName,
    getEmployeeName,
    getLaboratoryName,
    getStatusBadge,
    getPaymentStatusBadge,
  } = useOrders();

  // Determinar se é cliente ou funcionário/admin
  const isCustomer = loggedUserRole === "customer";
  const isEmployee = loggedUserRole === "employee" || loggedUserRole === "admin";

  // Aplicar filtro automático baseado no tipo de usuário
  useEffect(() => {
    if (loggedUserId && loggedUserRole) {
      let shouldUpdate = false;
      let newFilters = { ...filters };

      if (isCustomer) {
        // Para clientes: filtrar por clientId
        if (!filters.clientId || filters.clientId !== loggedUserId) {
          newFilters.clientId = loggedUserId;
          shouldUpdate = true;
        }
        // Remover filtro de funcionário se existir
        if (filters.employeeId) {
          delete newFilters.employeeId;
          shouldUpdate = true;
        }
      } else if (isEmployee) {
        // Para funcionários: filtrar por employeeId
        if (!filters.employeeId || filters.employeeId !== loggedUserId) {
          newFilters.employeeId = loggedUserId;
          shouldUpdate = true;
        }
        // Remover filtro de cliente se existir
        if (filters.clientId) {
          delete newFilters.clientId;
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        updateFilters(newFilters);
      }
    }
  }, [loggedUserId, loggedUserRole, filters, updateFilters, isCustomer, isEmployee]);
  


  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    // Não contar os filtros automáticos (clientId/employeeId)
    if (filters.status && filters.status !== 'all') count++;
    if (filters.paymentMethod && filters.paymentMethod !== 'all') count++;
    if (filters.laboratoryId && filters.laboratoryId !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  };

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

  const handleClearFilters = () => {
    // Manter apenas o filtro do usuário logado e limpar os outros
    const newFilters: any = {
      sort: "-createdAt"
    };
    
    if (isCustomer) {
      newFilters.clientId = loggedUserId;
    } else if (isEmployee) {
      newFilters.employeeId = loggedUserId;
    }
    
    updateFilters(newFilters);
    setSearch('');
  };

  const showEmptyState = !isLoading && !error && orders.length === 0;

  // Configurar colunas baseado no tipo de usuário
  const getOrderColumns = () => {
    const baseColumns = [
      { 
        key: "serviceOrder", 
        header: "O.S.",
        render: (order: Order) => (order.serviceOrder ? order.serviceOrder : "Sem O.S.")
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

    // Para funcionários, adicionar coluna de cliente
    // Para clientes, adicionar coluna de vendedor
    if (isEmployee) {
      baseColumns.splice(1, 0, {
        key: "client",
        header: "Cliente",
        render: (order: Order) => getClientName(order.clientId.toString())
      });
    } else if (isCustomer) {
      baseColumns.splice(1, 0, {
        key: "employee",
        header: "Vendedor",
        render: (order: Order) => getEmployeeName(order.employeeId.toString())
      });
    }

    return baseColumns;
  };

  // Filtros customizados para a página
  const handleUpdateFilters = (newFilters: Record<string, any>) => {
    // Sempre manter o filtro do usuário logado
    const filtersWithUser = { ...newFilters };
    
    if (isCustomer) {
      filtersWithUser.clientId = loggedUserId;
    } else if (isEmployee) {
      filtersWithUser.employeeId = loggedUserId;
    }
    
    updateFilters(filtersWithUser);
  };

  // Configurações de título e descrição baseado no tipo de usuário
  const getPageTitleAndDescription = () => {
    if (isCustomer) {
      return {
        title: "Meus Pedidos",
        description: `Pedidos realizados por você`
      };
    } else if (isEmployee) {
      return {
        title: "Meus Pedidos",
        description: `Pedidos registrados por ${loggedUserName || 'você'}`
      };
    }
    return {
      title: "Meus Pedidos",
      description: "Seus pedidos"
    };
  };

  const { title } = getPageTitleAndDescription();

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

  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      
      <PageContainer>
        <div className="space-y-8">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {isCustomer ? "Seus Pedidos" : "Pedidos Registrados"}
                </CardTitle>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPedidos.toLocaleString()}</div>
                <Badge variant="secondary" className="bg-blue-500 text-white border-0 text-xs mt-1">
                  +{pedidosHoje} hoje
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Em Produção
                </CardTitle>
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{emProducao}</div>
                <Badge variant="secondary" className="bg-orange-500 text-white border-0 text-xs mt-1">
                  {totalPedidos > 0 ? ((emProducao / totalPedidos) * 100).toFixed(1) : 0}% do total
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Prontos
                </CardTitle>
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prontos}</div>
                <Badge variant="secondary" className="bg-green-500 text-white border-0 text-xs mt-1">
                  {isCustomer ? "Para retirar" : "Aguardando entrega"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {isCustomer ? "Valor Gasto" : "Valor Vendido"}
                </CardTitle>
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalMes)}</div>
                <Badge variant="secondary" className="bg-purple-500 text-white border-0 text-xs mt-1">
                  Este mês
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Busca */}
          <ListPageHeader
            title={
              <div className="flex items-center gap-2">
                {isCustomer ? (
                  <>
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    {title}
                  </>
                ) : (
                  <>
                    <User className="h-5 w-5 text-blue-600" />
                    {title}
                  </>
                )}
              </div>
            }
            searchValue={search}
            searchPlaceholder={isCustomer ? "Buscar por O.S. ou vendedor..." : "Buscar por cliente, CPF ou O.S."}
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
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_production">Em produção</SelectItem>
                  <SelectItem value="ready">Pronto</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="todos-status">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos-status">Status do pagamento</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="partially_paid">Parcialmente pago</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </FilterSelects>

            <ActionButtons>
              <OrderExportButton 
                filters={isCustomer ? {clientId: loggedUserId} : {employeeId: loggedUserId}}
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
                onUpdateFilters={handleUpdateFilters}
                hideEmployeeFilter={isEmployee}
                hideClientFilter={isCustomer}
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
                  {isCustomer 
                    ? "Você ainda não possui pedidos ou nenhum corresponde aos filtros aplicados."
                    : "Você ainda não registrou pedidos ou nenhum corresponde aos filtros aplicados."
                  }
                </p>
                {(search || getActiveFiltersCount() > 0) && (
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                  >
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
                  columns={getOrderColumns()}
                  onDetailsClick={navigateToOrderDetails}
                  onEditClick={handleEditOrder}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                  totalItems={totalOrders}
                  sortField="createdAt"
                  sortDirection="desc"
                  key={`my-orders-table-${search}-${JSON.stringify(orders.length)}-${currentPage}`}
                />
              </div>
            )}
          </ListPageContent>
        </div>
      </PageContainer>
      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        mode={orderDialogMode}
        order={orderToEdit}
      />
    </>
  );
} 