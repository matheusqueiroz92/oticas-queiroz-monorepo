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
  totalOrders: number;
  pendingOrdersCount: number;
  weeklyCustomersCount: number;
  salesGrowthPercentage: number;
  todayOrdersCount: number;
  cashOpenTime: string;
  recentOrders: any[];
}

interface EmployeeDashboardProps {
  dashboardData: DashboardData;
  totalCustomers: number;
  currentCashRegister?: {
    currentBalance: number;
  };
  allPayments: any[];
  isLoadingOrders: boolean;
  isLoadingPayments: boolean;
  isLoadingCashRegister: boolean;
  getClientName: (clientId: string) => string;
  dialogStates: DialogStates;
  openDialog: (dialogName: keyof DialogStates) => void;
  closeDialog: (dialogName: keyof DialogStates) => void;
}

export function EmployeeDashboard({
  dashboardData,
  totalCustomers,
  currentCashRegister,
  allPayments,
  isLoadingOrders,
  isLoadingPayments,
  isLoadingCashRegister,
  getClientName,
  dialogStates,
  openDialog,
  closeDialog,
}: EmployeeDashboardProps) {
  return (
    <>
      {/* Pesquisa rápida de pedidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        <div className="col-span-1">
          <QuickOrderSearch />
        </div>
      </div>

      {/* Botões de Ações Rápidas */}
      <DashboardQuickActions
        dialogStates={dialogStates}
        openDialog={openDialog}
        closeDialog={closeDialog}
      />

      {/* Cards de estatísticas */}
      <DashboardStats
        salesTotal={dashboardData.salesTotal}
        totalOrders={dashboardData.totalOrders}
        pendingOrdersCount={dashboardData.pendingOrdersCount}
        totalCustomers={totalCustomers}
        weeklyCustomersCount={dashboardData.weeklyCustomersCount}
        currentBalance={currentCashRegister?.currentBalance || 0}
        salesGrowthPercentage={dashboardData.salesGrowthPercentage}
        todayOrdersCount={dashboardData.todayOrdersCount}
        cashOpenTime={dashboardData.cashOpenTime}
        isLoadingPayments={isLoadingPayments}
        isLoadingOrders={isLoadingOrders}
        isLoadingCashRegister={isLoadingCashRegister}
      />

      {/* Seção de conteúdo principal */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Pedidos Recentes */}
        <div className="xl:col-span-1">
          <RecentOrdersList
            recentOrders={dashboardData.recentOrders}
            isLoadingOrders={isLoadingOrders}
            getClientName={getClientName}
          />
        </div>

        {/* Gráfico de Vendas */}
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