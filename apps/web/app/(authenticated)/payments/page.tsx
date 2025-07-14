"use client";

import { useState } from "react";
import { usePayments } from "@/hooks/usePayments";
import { usePaymentsFilters } from "@/hooks/usePaymentsFilters";
import { usePaymentsStats } from "@/hooks/usePaymentsStats";
import { usePaymentsPageState } from "@/hooks/usePaymentsPageState";
import { PaymentsStatsCards } from "@/components/payments/PaymentsStatsCards";
import { PaymentsTableWithFilters } from "@/components/payments/PaymentsTableWithFilters";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { PageContainer } from "@/components/ui/page-container";
import { CashRegisterStatus } from "@/components/cash-register/CashRegisterStatus";
import { customBadgeStyles } from "@/app/_utils/custom-badge-styles";
import { usePaymentsEntitiesMaps } from '@/hooks/usePaymentsEntitiesMaps';

export default function PaymentsPage() {
  const { state, actions } = usePaymentsPageState();

  const {
    payments,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalPayments,
    setCurrentPage,
    updateFilters,
    handleCancelPayment,
    navigateToPaymentDetails,
    refetch,
  } = usePayments();

  // Estados para filtros básicos
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const {
    getActiveFiltersCount,
    handleTypeFilterChange,
    handlePaymentMethodFilterChange,
    handleStatusFilterChange,
    handleUpdateFilters,
    handleClearAllFilters,
  } = usePaymentsFilters({
    search,
    setSearch,
    filters: {},
    updateFilters: (newFilters) => {
      updateFilters({ ...newFilters, search });
    },
  });

  const stats = usePaymentsStats({ payments });
  const showEmptyState = !isLoading && !error && payments.length === 0;

  // Mapas de entidades para exibição correta
  const { customerIdToName, orderIdToServiceOrder } = usePaymentsEntitiesMaps(payments);

  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      
      <PageContainer>
        <div className="space-y-8">
          {/* Cards de Estatísticas */}
          <PaymentsStatsCards
            totalPayments={stats.totalPayments}
            paymentsToday={stats.paymentsToday}
            sales={stats.sales}
            expenses={stats.expenses}
            totalMonth={stats.totalMonth}
            salesAmount={stats.salesAmount}
            expensesAmount={stats.expensesAmount}
            netBalance={stats.netBalance}
          />

          {/* Status do Caixa (sem wrapper) */}
          <CashRegisterStatus showOpenButton />

          {/* Tabela de Pagamentos com Filtros */}
          <PaymentsTableWithFilters
            payments={payments}
            isLoading={isLoading}
            error={error}
            search={search}
            onSearchChange={setSearch}
            showFilters={state.showFilters}
            onToggleFilters={actions.toggleFilters}
            activeFiltersCount={getActiveFiltersCount()}
            typeFilter={typeFilter}
            onTypeFilterChange={(value) => {
              setTypeFilter(value);
              handleTypeFilterChange(value);
            }}
            paymentMethodFilter={paymentMethodFilter}
            onPaymentMethodFilterChange={(value) => {
              setPaymentMethodFilter(value);
              handlePaymentMethodFilterChange(value);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => {
              setStatusFilter(value);
              handleStatusFilterChange(value);
            }}
            filters={{}}
            onUpdateFilters={handleUpdateFilters}
            onClearFilters={handleClearAllFilters}
            onNewPayment={actions.handleOpenNewPayment}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalItems={totalPayments}
            showEmptyState={showEmptyState}
            cancelPayment={handleCancelPayment}
            navigateToPaymentDetails={navigateToPaymentDetails}
            getClientName={(id) => customerIdToName[id] || 'Cliente'}
            getOrderNumber={(id) => orderIdToServiceOrder[id] || id}
          />
        </div>
      </PageContainer>
      
      <PaymentDialog
        open={state.paymentDialogOpen}
        onOpenChange={actions.handleClosePaymentDialog}
        onSuccess={() => {
          refetch();
        }}
      />
    </>
  );
}