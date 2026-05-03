"use client";

import { useOrders } from "@/hooks/orders/useOrders";
import { OrderDialog } from "@/components/orders/OrderDialog";
import { OrdersStatsCards } from "@/components/orders/OrdersStatsCards";
import { OrdersTableWithFilters } from "@/components/orders/OrdersTableWithFilters";
import { PageContainer } from "@/components/ui/page-container";
import { useOrdersPageState } from "@/hooks/orders/useOrdersPageState";
import { useOrdersStats } from "@/hooks/orders/useOrdersStats";
import { useOrdersFilters } from "@/hooks/orders/useOrdersFilters";
import { getOrderTableColumns } from "@/app/_utils/orders-table-config";
import { customBadgeStyles } from "@/app/_utils/custom-badge-styles";

export default function OrdersPage() {
  const { state, actions } = useOrdersPageState();
  
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

  const stats = useOrdersStats(orders);

  const {
    getActiveFiltersCount,
    handleStatusFilterChange,
    handleUpdateFilters,
  } = useOrdersFilters({ search, filters, setSearch, updateFilters });

  const showEmptyState = !isLoading && !error && orders.length === 0;

  const orderColumns = getOrderTableColumns({
    getClientName,
    getEmployeeName,
    getLaboratoryName,
    getStatusBadge,
    getPaymentStatusBadge,
  });

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

          {/* Tabela de Pedidos com Filtros */}
          <OrdersTableWithFilters
            orders={orders}
            isLoading={isLoading}
            error={error}
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
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalOrders={totalOrders}
            showEmptyState={showEmptyState}
          />
        </div>
      </PageContainer>
      
      <OrderDialog
        open={state.orderDialogOpen}
        onOpenChange={actions.handleCloseDialog}
        order={state.orderToEdit}
        mode={state.orderDialogMode}
      />
    </>
  );
}