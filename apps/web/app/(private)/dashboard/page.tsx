"use client";

import { PageContainer } from "@/components/ui/page-container";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { CustomerDashboard } from "@/components/dashboard/CustomerDashboard";
import { useDashboard } from "@/hooks/dashboard/useDashboard";

export default function DashboardPage() {
  const { 
    userName,
    userId,
    isCustomer,
    isLoadingOrders,
    isLoadingPayments,
    isLoadingSalesStats,
    isLoadingOrdersStats,
    isLoadingCashRegister,
    isLoadingLegacyClient,
    dashboardData,
    currentCashRegister,
    legacyClient,
    getClientName,
    allPayments,
    dialogStates,
    openDialog,
    closeDialog,
  } = useDashboard();

  return (
    <PageContainer>
      <div className="space-y-4">
        {!isCustomer ? (
          <EmployeeDashboard
            dashboardData={dashboardData}
            userId={userId}
            currentCashRegister={currentCashRegister || undefined}
            allPayments={allPayments}
            isLoadingOrders={isLoadingOrders}
            isLoadingPayments={isLoadingPayments}
            isLoadingSalesStats={isLoadingSalesStats}
            isLoadingOrdersStats={isLoadingOrdersStats}
            isLoadingCashRegister={isLoadingCashRegister}
            getClientName={getClientName}
            dialogStates={dialogStates}
            openDialog={openDialog}
            closeDialog={closeDialog}
          />
        ) : (
          <CustomerDashboard
            userName={userName}
            isLoadingLegacyClient={isLoadingLegacyClient}
            legacyClient={legacyClient}
          />
        )}
      </div>
    </PageContainer>
  );
}