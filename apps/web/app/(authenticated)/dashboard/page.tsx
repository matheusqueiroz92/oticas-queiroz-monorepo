"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  DollarSign,
  FileText,
  UserPlus,
  ShoppingBag,
  Package,
  Plus,
  TrendingUp,
  Users,
  HandCoins,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getOrderStatusClass, translateOrderStatus } from "@/app/_utils/formatters";
import { QuickOrderSearch } from "@/components/orders/QuickOrderSearch";
import type { Order } from "@/app/_types/order";
import type { IPayment } from "@/app/_types/payment";
import { useOrders } from "@/hooks/useOrders";
import { usePayments } from "@/hooks/usePayments";
import { useCashRegister } from "@/hooks/useCashRegister";
import { useLegacyClients } from "@/hooks/useLegacyClients";
import { PageContainer } from "@/components/ui/page-container";
import { OrderDialog } from "@/components/orders/OrderDialog";
import { CustomerDialog } from "@/components/customers/CustomerDialog";

type OrderStatus = "pending" | "in_production" | "ready" | "delivered" | "cancelled";

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  useEffect(() => {
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";
    const id = Cookies.get("userId") || "";

    setUserName(name);
    setUserRole(role);
    setUserId(id);
  }, []);

  const isCustomer = userRole === "customer";

  const { 
    isLoading: isLoadingOrders,
    orders: allOrders,
    getClientName,
  } = useOrders();


  const { isLoading: isLoadingPayments, payments: allPayments } = usePayments();

  const { isLoading: isLoadingCashRegister, currentCashRegister } = useCashRegister();


  const { useSearchLegacyClient } = useLegacyClients();
  
  const {
    data: legacyClient,
    isLoading: isLoadingLegacyClient
  } = useSearchLegacyClient(isCustomer ? userId : undefined);



  const renderListSkeleton = (rows = 3) => {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {Array(rows).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-4">
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };



  const getTodayPayments = (payments: IPayment[] = []): IPayment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() === today.getTime();
    });
  };

  const getSalesTotal = (payments: IPayment[] = []): number => {
    return payments.filter(p => p.type === 'sale').reduce((sum, p) => sum + p.amount, 0);
  };

  const getOrdersCountByStatus = (orders: Order[] = [], statuses: OrderStatus[]): number => {
    return orders.filter(o => statuses.includes(o.status as OrderStatus)).length;
  };

  const todayPayments = allPayments ? getTodayPayments(allPayments as IPayment[]) : [];
  
  const recentOrders = [...(allOrders || [])].sort((a, b) => 
    new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime()
  ).slice(0, 3);

  return (
    <PageContainer>
      <div className="space-y-6">
      {!isCustomer && (
        <>
          {/* Pesquisa rápida de pedidos */}
          <div className="w-full max-w-md">
            <QuickOrderSearch />
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-5 gap-4">
            <OrderDialog
              open={orderDialogOpen}
              onOpenChange={setOrderDialogOpen}
              mode="create"
            />
            <button
              type="button"
              onClick={() => setOrderDialogOpen(true)}
              aria-label="Abrir novo pedido"
              className="h-full w-full text-left"
              style={{ all: "unset" }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-primary/50 h-full w-full">
                <CardContent className="flex items-center justify-center p-10 gap-4">
                  <div className="rounded-full bg-blue-100/10 p-4 flex items-center justify-center">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-md font-bold">Novo Pedido</span>
                    <span className="text-xs text-muted-foreground">Criar pedido</span>
                  </div>
                </CardContent>
              </Card>
            </button>

            <CustomerDialog
              open={customerDialogOpen}
              onOpenChange={setCustomerDialogOpen}
              mode="create"
            />
            <button
              type="button"
              onClick={() => setCustomerDialogOpen(true)}
              aria-label="Abrir novo cliente"
              className="h-full w-full text-left"
              style={{ all: "unset" }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-primary/50 h-full w-full">
                <CardContent className="flex items-center justify-center p-10 gap-4">
                  <div className="rounded-full bg-blue-100/10 p-4 flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-md font-bold">Novo Cliente</span>
                    <span className="text-xs text-muted-foreground">Cadastrar cliente</span>
                  </div>
                </CardContent>
              </Card>
            </button>

            <CustomerDialog
              open={customerDialogOpen}
              onOpenChange={setCustomerDialogOpen}
              mode="create"
            />    
            <button
              type="button"
              onClick={() => setCustomerDialogOpen(true)}
              aria-label="Abrir novo produto"
              className="h-full w-full text-left"
              style={{ all: "unset" }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-primary/50 h-full w-full">
                <CardContent className="flex items-center justify-center p-10 gap-4">
                  <div className="rounded-full bg-blue-100/10 p-4 flex items-center justify-center">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-md font-bold">Novo Produto</span>
                    <span className="text-xs text-muted-foreground">Cadastrar produto</span>
                  </div>
                </CardContent>
              </Card>
            </button>

            <CustomerDialog
              open={customerDialogOpen}
              onOpenChange={setCustomerDialogOpen}
              mode="create"
            />
            <button
              type="button"
              onClick={() => setCustomerDialogOpen(true)}
              aria-label="Abrir novo pagamento"
              className="h-full w-full text-left"
              style={{ all: "unset" }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-primary/50 h-full w-full">
                <CardContent className="flex items-center justify-center p-10 gap-4">
                  <div className="rounded-full bg-blue-100/10 p-4 flex items-center justify-center">
                    <HandCoins className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-md font-bold">Novo Pagamento</span>
                    <span className="text-xs text-muted-foreground">Cadastrar pagamento</span>
                  </div>
                </CardContent>
              </Card>
            </button>

            <CustomerDialog
              open={customerDialogOpen}
              onOpenChange={setCustomerDialogOpen}
              mode="create"
            />
            <button
              type="button"
              onClick={() => setCustomerDialogOpen(true)}
              aria-label="Abrir novo relatório"
              className="h-full w-full text-left"
              style={{ all: "unset" }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-primary/50 h-full w-full">
                <CardContent className="flex items-center justify-center p-10 gap-4">
                  <div className="rounded-full bg-blue-100/10 p-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-md font-bold">Novo Relatório</span>
                    <span className="text-xs text-muted-foreground">Gerar relatório</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vendas Hoje */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Vendas Hoje</CardTitle>
                <div className="rounded-full bg-green-200 p-2 flex items-center justify-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(getSalesTotal(todayPayments))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="h-4 w-4 inline mr-1 text-green-600" />
                      +12% vs ontem
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pedidos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Pedidos</CardTitle>
                <div className="rounded-full bg-blue-200 p-2 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{allOrders?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-blue-600 font-semibold">
                        +{getOrdersCountByStatus(allOrders, ["pending"])}
                      </span>{" "}
                      vs ontem
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Clientes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Clientes</CardTitle>
                <div className="rounded-full bg-yellow-200 p-2 flex items-center justify-center">
                  <Users className="h-8 w-8 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.247</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-yellow-600 font-semibold">+5</span> novos
                </p>
              </CardContent>
            </Card>

            {/* Caixa Atual */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Caixa Atual</CardTitle>
                <div className="rounded-full bg-violet-200 p-2 flex items-center justify-center">
                  <HandCoins className="h-8 w-8 text-violet-600" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCashRegister ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(currentCashRegister?.currentBalance || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aberto às <span className="text-purple-600 font-semibold">08:00</span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Seção de conteúdo principal */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pedidos Recentes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pedidos Recentes</CardTitle>
                  <Link href="/orders">
                    <Button variant="outline" size="sm">
                      Ver todos
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingOrders ? (
                  <div className="divide-y">
                    {renderListSkeleton(3)}
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="divide-y">
                    {recentOrders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">#{order.serviceOrder}</p>
                          <p className="text-sm text-muted-foreground">
                            {getClientName(order.clientId)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.finalPrice)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusClass(order.status)}`}>
                            {translateOrderStatus(order.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendas dos Últimos 7 Dias - placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Gráfico de vendas será implementado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                O sistema de gerenciamento das Óticas Queiroz oferece diversas
                funcionalidades para facilitar o seu trabalho diário.
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