"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";
import { QuickOrderSearch } from "@/components/orders/QuickOrderSearch";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { RecentOrdersList } from "@/components/dashboard/RecentOrdersList";
import { SalesChart } from "@/components/dashboard/SalesChart";
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
      <div className="space-y-6">
        {!isCustomer && (
          <>
            {/* Pesquisa rápida de pedidos */}
            <div className="w-full max-w-md">
              <QuickOrderSearch />
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
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

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
        )}

      {isCustomer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[var(--primary-blue)]">Bem-vindo ao Sistema</CardTitle>
              <CardDescription>
                {userName ? `Olá, ${userName}! ` : ""}
                Acesse as funções do sistema através do menu lateral.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Acesse suas compras, pedidos, débitos e pagamentos.
              </p>
            </CardContent>
          </Card>

          {isLoadingLegacyClient ? (
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ) : legacyClient ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dados do Cliente Legado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Nome:</strong> {legacyClient.name}</p>
                  <p><strong>Telefone:</strong> {legacyClient.phone || "Não informado"}</p>
                  <p><strong>Endereço:</strong> {legacyClient.address?.street || "Não informado"}</p>
                  <p><strong>CPF:</strong> {legacyClient.cpf || "Não informado"}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Cliente Legado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nenhum dado legado encontrado para este usuário.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </div>
    </PageContainer>
  );
}