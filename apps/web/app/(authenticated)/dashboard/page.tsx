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
import { ProductDialog } from "@/components/products/ProductDialog";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { StatCard } from "@/components/dashboard/StatCard";

type OrderStatus = "pending" | "in_production" | "ready" | "delivered" | "cancelled";

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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
            <QuickActionButton
              icon={Plus}
              title="Novo Pedido"
              description="Criar pedido"
              onClick={() => setOrderDialogOpen(true)}
              ariaLabel="Abrir novo pedido"
            >
              <OrderDialog
                open={orderDialogOpen}
                onOpenChange={setOrderDialogOpen}
                mode="create"
              />
            </QuickActionButton>

            <QuickActionButton
              icon={UserPlus}
              title="Novo Cliente"
              description="Cadastrar cliente"
              onClick={() => setCustomerDialogOpen(true)}
              ariaLabel="Abrir novo cliente"
            >
              <CustomerDialog
                open={customerDialogOpen}
                onOpenChange={setCustomerDialogOpen}
                mode="create"
              />
            </QuickActionButton>

            <QuickActionButton
              icon={Package}
              title="Novo Produto"
              description="Cadastrar produto"
              onClick={() => setProductDialogOpen(true)}
              ariaLabel="Abrir novo produto"
            >
              <ProductDialog
                open={productDialogOpen}
                onOpenChange={setProductDialogOpen}
                mode="create"
              />
            </QuickActionButton>

            <QuickActionButton
              icon={HandCoins}
              title="Novo Pagamento"
              description="Cadastrar pagamento"
              onClick={() => setPaymentDialogOpen(true)}
              ariaLabel="Abrir novo pagamento"
            >
              <PaymentDialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                mode="create"
              />
            </QuickActionButton>

            <QuickActionButton
              icon={FileText}
              title="Novo Relatório"
              description="Gerar relatório"
              onClick={() => setCustomerDialogOpen(true)}
              ariaLabel="Abrir novo relatório"
            >
              <CustomerDialog
                open={customerDialogOpen}
                onOpenChange={setCustomerDialogOpen}
                mode="create"
              />
            </QuickActionButton>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Vendas Hoje"
              value={formatCurrency(getSalesTotal(todayPayments))}
              icon={DollarSign}
              iconColor="text-green-600"
              bgColor="bg-green-100 dark:bg-green-100/10"
              isLoading={isLoadingPayments}
              description={
                <>
                  <TrendingUp className="h-4 w-4 inline mr-1 text-green-600" />
                  +12% vs ontem
                </>
              }
            />

            <StatCard
              title="Pedidos"
              value={allOrders?.length || 0}
              icon={ShoppingBag}
              iconColor="text-orange-600"
              bgColor="bg-orange-100 dark:bg-orange-100/10"
              isLoading={isLoadingOrders}
              skeletonWidth="w-16"
              description={
                <>
                  <span className="text-orange-600 font-semibold">
                    +{getOrdersCountByStatus(allOrders, ["pending"])}
                  </span>{" "}
                  vs ontem
                </>
              }
            />

            <StatCard
              title="Clientes"
              value="1.247"
              icon={Users}
              iconColor="text-yellow-600"
              bgColor="bg-yellow-100 dark:bg-yellow-100/10"
              description={
                <>
                  <span className="text-yellow-600 font-semibold">+5</span> novos
                </>
              }
            />

            <StatCard
              title="Caixa Atual"
              value={formatCurrency(currentCashRegister?.currentBalance || 0)}
              icon={HandCoins}
              iconColor="text-violet-600"
              bgColor="bg-violet-100 dark:bg-violet-100/10"
              isLoading={isLoadingCashRegister}
              description={
                <>
                  Aberto às <span className="text-purple-600 font-semibold">08:00</span>
                </>
              }
            />
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