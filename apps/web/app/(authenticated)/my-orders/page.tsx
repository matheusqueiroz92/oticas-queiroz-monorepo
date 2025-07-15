"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { useOrders } from "@/hooks/useOrders";
import { OrderDialog } from "@/components/orders/OrderDialog";
import { OrdersStatsCards } from "@/components/orders/OrdersStatsCards";
import { MyOrdersTableWithFilters } from "@/components/orders/MyOrdersTableWithFilters";
import { PageContainer } from "@/components/ui/page-container";
import { useMyOrdersPageState } from "@/hooks/useMyOrdersPageState";
import { useMyOrdersFilters } from "@/hooks/useMyOrdersFilters";
import { useMyOrdersPageTitle } from "@/hooks/useMyOrdersPageTitle";
import { useOrdersStats } from "@/hooks/useOrdersStats";
import { getMyOrdersTableColumns } from "@/app/_utils/my-orders-table-config";
import { customBadgeStyles } from "@/app/_utils/custom-badge-styles";

export default function MyOrdersPage() {
  const { state, actions } = useMyOrdersPageState();
  
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
    useMyOrders,
  } = useOrders();

  // Para clientes: usar hook específico useMyOrders
  const {
    data: myOrdersData,
    isLoading: isLoadingMyOrders,
    error: myOrdersError,
  } = useMyOrders();

  // Configurar dados baseado no tipo de usuário
  const finalOrders = state.isCustomer ? (myOrdersData || []) : orders;
  const finalIsLoading = state.isCustomer ? isLoadingMyOrders : isLoading;
  const finalError = state.isCustomer ? (myOrdersError ? String(myOrdersError) : null) : error;

  const stats = useOrdersStats(finalOrders);

  const {
    shouldUseFilters,
    getActiveFiltersCount,
    handleClearFilters,
    handleUpdateFilters,
    handleStatusFilterChange,
  } = useMyOrdersFilters({
    search,
    setSearch,
    filters,
    updateFilters,
    isCustomer: state.isCustomer,
    isEmployee: state.isEmployee,
    loggedUserId: state.loggedUserId,
  });

  const { title } = useMyOrdersPageTitle(state.isCustomer, state.isEmployee, state.loggedUserName);

  const showEmptyState = !finalIsLoading && !finalError && finalOrders.length === 0;

  const orderColumns = getMyOrdersTableColumns({
    isCustomer: state.isCustomer,
    isEmployee: state.isEmployee,
    getClientName,
    getEmployeeName,
    getLaboratoryName,
    getStatusBadge,
    getPaymentStatusBadge,
  });

  // Carregar dados do usuário logado
  useEffect(() => {
    const userId = Cookies.get("userId");
    const userName = Cookies.get("name");
    const userRole = Cookies.get("role");
    
    if (userId) {
      actions.setLoggedUserId(userId);
    }
    if (userName) {
      actions.setLoggedUserName(userName);
    }
    if (userRole) {
      actions.setLoggedUserRole(userRole);
    }
  }, [actions]);

  // Para funcionários/admins: aplicar filtros automáticos
  useEffect(() => {
    if (shouldUseFilters && state.loggedUserId && state.loggedUserRole && state.isEmployee) {
      let shouldUpdate = false;
      let newFilters = { ...filters };

      // Para funcionários: filtrar por employeeId
      if (!filters.employeeId || filters.employeeId !== state.loggedUserId) {
        newFilters.employeeId = state.loggedUserId;
        shouldUpdate = true;
      }
      // Remover filtro de cliente se existir
      if (filters.clientId) {
        delete newFilters.clientId;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        updateFilters(newFilters);
      }
    }
  }, [shouldUseFilters, state.loggedUserId, state.loggedUserRole, filters, updateFilters, state.isEmployee]);

  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      
      <PageContainer>
        <div className="space-y-8">
          {/* Cards de Estatísticas */}
          <OrdersStatsCards
            totalOrdersLength={stats.totalOrdersLength}
            ordersToday={stats.ordersToday}
            ordersInProduction={stats.ordersInProduction}
            ordersReady={stats.ordersReady}
            totalOrdersMonth={stats.totalOrdersMonth}
          />

          {/* Tabela de Meus Pedidos com Filtros */}
          <MyOrdersTableWithFilters
            orders={finalOrders}
            isLoading={finalIsLoading}
            error={finalError}
            search={search}
            onSearchChange={setSearch}
            showFilters={state.showFilters}
            onToggleFilters={actions.handleToggleFilters}
            activeFiltersCount={getActiveFiltersCount()}
            filters={filters}
            onStatusFilterChange={handleStatusFilterChange}
            onUpdateFilters={handleUpdateFilters}
            onOpenNewOrder={actions.handleOpenNewOrder}
            orderColumns={orderColumns}
            onDetailsClick={navigateToOrderDetails}
            onEditClick={actions.handleEditOrder}
            onClearFilters={handleClearFilters}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalOrders={totalOrders}
            showEmptyState={showEmptyState}
            loggedUserId={state.loggedUserId}
            isEmployee={state.isEmployee}
            isCustomer={state.isCustomer}
            title={title}
          />
        </div>
      </PageContainer>
      
      <OrderDialog
        open={state.orderDialogOpen}
        onOpenChange={actions.handleCloseDialog}
        mode={state.orderDialogMode}
        order={state.orderToEdit}
      />
    </>
  );
} 