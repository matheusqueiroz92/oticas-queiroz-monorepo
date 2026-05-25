import { QuickOrderSearch } from "@/components/dashboard/QuickOrderSearch";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { RecentOrdersList } from "@/components/dashboard/RecentOrdersList";
import { SalesChart } from "@/components/dashboard/SalesChart";

interface DialogStates {
  orderDialogOpen: boolean;
  customerDialogOpen: boolean;
  productDialogOpen: boolean;
  paymentDialogOpen: boolean;
}

interface DashboardData {
  salesTotal: number;
  weeklyCustomersCount: number;
  salesGrowthPercentage: number;
  todayOrdersCount: number;
  ordersGrowthPercentage: number;
  cashOpenTime: string;
  recentOrders: any[];
}

interface EmployeeDashboardProps {
  dashboardData: DashboardData;
  userId: string;
  currentCashRegister?: {
    currentBalance: number;
    status?: "open" | "closed";
  };
  allPayments: any[];
  isLoadingOrders: boolean;
  isLoadingPayments: boolean;
  isLoadingSalesStats: boolean;
  isLoadingOrdersStats: boolean;
  isLoadingCashRegister: boolean;
  getClientName: (clientId: string) => string;
  dialogStates: DialogStates;
  openDialog: (dialogName: keyof DialogStates) => void;
  closeDialog: (dialogName: keyof DialogStates) => void;
}

export function EmployeeDashboard({
  dashboardData,
  userId,
  currentCashRegister,
  allPayments,
  isLoadingOrders,
  isLoadingPayments,
  isLoadingSalesStats,
  isLoadingOrdersStats,
  isLoadingCashRegister,
  getClientName,
  dialogStates,
  openDialog,
  closeDialog,
}: EmployeeDashboardProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="col-span-2">
          <QuickOrderSearch />
        </div>
      </div>

      <DashboardQuickActions
        dialogStates={dialogStates}
        openDialog={openDialog}
        closeDialog={closeDialog}
      />

      <DashboardStats
        userId={userId}
        weeklyCustomersCount={dashboardData.weeklyCustomersCount}
        salesTotal={dashboardData.salesTotal}
        todayOrdersCount={dashboardData.todayOrdersCount}
        ordersGrowthPercentage={dashboardData.ordersGrowthPercentage}
        currentBalance={currentCashRegister?.currentBalance ?? 0}
        isCashRegisterOpen={currentCashRegister?.status === "open"}
        salesGrowthPercentage={dashboardData.salesGrowthPercentage}
        cashOpenTime={dashboardData.cashOpenTime}
        isLoadingSalesStats={isLoadingSalesStats}
        isLoadingOrdersStats={isLoadingOrdersStats}
        isLoadingCashRegister={isLoadingCashRegister}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-1">
          <RecentOrdersList
            recentOrders={dashboardData.recentOrders}
            isLoadingOrders={isLoadingOrders}
            getClientName={getClientName}
          />
        </div>

        <div className="xl:col-span-3">
          <SalesChart
            payments={allPayments || []}
            isLoading={isLoadingPayments}
          />
        </div>
      </div>
    </>
  );
}
