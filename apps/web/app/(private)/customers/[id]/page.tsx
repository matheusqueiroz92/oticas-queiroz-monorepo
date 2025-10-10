"use client";

import { useParams, useRouter } from "next/navigation";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { CustomerDetailsHeader } from "@/components/customers/CustomerDetailsHeader";
import { CustomerInfoCard } from "@/components/customers/CustomerInfoCard";
import { CustomerDetailsStatsSection } from "@/components/customers/CustomerDetailsStatsSection";
import { CustomerOrdersHistory } from "@/components/customers/CustomerOrdersHistory";
import { CustomerDetailsLoading } from "@/components/customers/CustomerDetailsLoading";
import { CustomerDetailsError } from "@/components/customers/CustomerDetailsError";
import { useCustomerDetailsState } from "@/hooks/customers/useCustomerDetailsState";
import { useCustomerDetailsData } from "@/hooks/customers/useCustomerDetailsData";
import { useCustomerDetailsStats } from "@/hooks/customers/useCustomerDetailsStats";
import { useCustomerOrderFilters } from "@/hooks/customers/useCustomerOrderFilters";

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, actions } = useCustomerDetailsState();
  
  const { customer, orders, isLoading, error, refetchCustomer } = useCustomerDetailsData(id as string);
  
  const stats = useCustomerDetailsStats(customer, orders);
  
  const { filteredOrders } = useCustomerOrderFilters(orders, state.statusFilter);

  const handleGoBack = () => {
    router.push("/customers");
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const handleViewAllOrders = () => {
    router.push(`/orders?clientId=${id}`);
  };

  // Loading state
  if (isLoading) {
    return <CustomerDetailsLoading />;
  }

  // Error state
  if (error || !customer) {
    return <CustomerDetailsError error={error} onGoBack={handleGoBack} />;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <CustomerDetailsHeader
        onGoBack={handleGoBack}
        onEditCustomer={actions.handleOpenEditDialog}
      />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda - Informações e Estatísticas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Principal do Cliente */}
          <CustomerInfoCard
            customer={customer}
            customerSince={stats.customerSince}
          />

          {/* Estatísticas */}
          <CustomerDetailsStatsSection
            totalSpent={stats.totalSpent}
            currentMonthSpent={stats.currentMonthSpent}
            totalOrders={stats.totalOrders}
            currentMonthOrders={stats.currentMonthOrders}
            totalGlasses={stats.totalGlasses}
            lastDeliveryDate={stats.lastDeliveryDate}
            deliveredOrdersCount={stats.deliveredOrdersCount}
            loyaltyPoints={stats.loyaltyPoints}
          />
        </div>

        {/* Coluna Direita - Histórico de Pedidos */}
        <div className="lg:col-span-1">
          <CustomerOrdersHistory
            filteredOrders={filteredOrders}
            statusFilter={state.statusFilter}
            onStatusFilterChange={actions.handleStatusFilterChange}
            onViewOrder={handleViewOrder}
            onViewAllOrders={handleViewAllOrders}
            customerId={id as string}
          />
        </div>
      </div>

      {/* Dialog de Edição do Cliente */}
      {state.editDialogOpen && (
        <CustomerDialog
          open={state.editDialogOpen}
          onOpenChange={actions.handleCloseEditDialog}
          customer={customer}
          mode="edit"
          onSuccess={() => {
            refetchCustomer();
          }}
        />
      )}
    </div>
  );
}