"use client";

import { PageContainer } from "@/components/ui/page-container";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { CustomerDashboard } from "@/components/dashboard/CustomerDashboard";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { 
    userName,
    isCustomer,
    isLoadingOrders,
    isLoadingPayments,
    isLoadingCashRegister,
    isLoadingLegacyClient,
    dashboardData,
    totalCustomers,
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
            totalCustomers={totalCustomers}
            currentCashRegister={currentCashRegister || undefined}
            allPayments={allPayments}
            isLoadingOrders={isLoadingOrders}
            isLoadingPayments={isLoadingPayments}
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