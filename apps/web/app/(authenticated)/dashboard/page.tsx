"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { use, useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  DollarSign,
  FileText,
  UserPlus,
  AlertCircle,
  ShoppingBag,
  CalendarCheck,
  RefreshCw,
  Store,
  Package,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getOrderStatusClass, translateOrderStatus } from "@/app/utils/formatters";
import { QuickOrderSearch } from "@/components/Orders/QuickOrderSearch";

import type { Order } from "@/app/types/order";
import type { IPayment } from "@/app/types/payment";
import { useOrders } from "@/hooks/useOrders";
import { usePayments } from "@/hooks/usePayments";
import { useCashRegister } from "@/hooks/useCashRegister";
import { useUsers } from "@/hooks/useUsers";
import { useLegacyClients } from "@/hooks/useLegacyClients";
import { Employee } from "@/app/types/employee";
import { formatDate } from "../../../app/utils/formatters"
import { PageTitle } from "@/components/PageTitle";

type OrderStatus = "pending" | "in_production" | "ready" | "delivered" | "cancelled";

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const name = Cookies.get("name") || "";
    const role = Cookies.get("role") || "";
    const id = Cookies.get("userId") || "";

    setUserName(name);
    setUserRole(role);
    setUserId(id);
  }, []);

  const isAdmin = userRole === "admin";
  const isEmployee = userRole === "employee";
  const isCustomer = userRole === "customer";

  const { 
    isLoading: isLoadingOrders,
    orders: allOrders,
    refetch: refetchOrders,
    getEmployeeName,
    getClientName,
    useClientOrders,
  } = useOrders();

  const { 
    data: customerOrders, 
    isLoading: isLoadingCustomerOrders 
  } = useClientOrders(isCustomer ? userId : undefined);

  const { isLoading: isLoadingPayments, payments: allPayments, refetch: refetchPayments } = usePayments();

  const { isLoading: isLoadingCashRegister, currentCashRegister, refetch: refetchCashRegister } = useCashRegister();

  const { isLoading: isLoadingEmployees, employees } = useUsers();

  const { useSearchLegacyClient } = useLegacyClients();
  
  const {
    data: legacyClient,
    isLoading: isLoadingLegacyClient
  } = useSearchLegacyClient(isCustomer ? userId : undefined);

  const renderSkeleton = (count = 3) => {
    return Array(count).fill(0).map((_, index) => (
      <Card key={index}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Skeleton className="h-5 w-5 mr-2" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-3 w-20 mt-2" />
        </CardContent>
      </Card>
    ));
  };

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
        <CardFooter className="border-t px-6 py-3">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  };

  const refreshDashboard = () => {
    refetchOrders();
    refetchPayments();
    refetchCashRegister();
  };

  const getTodayOrders = (orders: Order[] = []): Order[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
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

  const todayOrders = allOrders ? getTodayOrders(allOrders as Order[]) : [];
  const todayPayments = allPayments ? getTodayPayments(allPayments as IPayment[]) : [];
  const recentOrders = [...(allOrders || [])].sort((a, b) => 
    new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime()
  ).slice(0, 3);

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <div className="flex justify-between items-center">
        <PageTitle
          title="Dashboard"
          description="Gerencie e visualize dados da loja"
        />
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao Sistema</CardTitle>
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
        
        <QuickOrderSearch />
      </div>

      {isAdmin && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold mt-8">Visão Geral da Empresa</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshDashboard}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Atualizar
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {isLoadingPayments || isLoadingCashRegister || isLoadingOrders ? (
              renderSkeleton(3)
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Vendas Hoje
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-primary mr-2" />
                      <div className="text-2xl font-bold">
                        {formatCurrency(getSalesTotal(todayPayments))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {todayPayments.filter(p => p.type === 'sale').length || 0} transações hoje
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pedidos em Aberto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-primary mr-2" />
                      <div className="text-2xl font-bold">
                        {getOrdersCountByStatus(allOrders as Order[], ['pending', 'in_production'])}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getOrdersCountByStatus(allOrders as Order[], ['ready'])} pedidos prontos para entrega
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Saldo do Caixa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-primary mr-2" />
                      <div className="text-2xl font-bold">
                        {currentCashRegister?.status === 'open' 
                          ? formatCurrency(currentCashRegister.currentBalance) 
                          : "Caixa fechado"}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentCashRegister?.status === 'open'
                        ? `Aberto às ${new Date(currentCashRegister.openingDate).toLocaleTimeString("pt-BR")}`
                        : "Nenhum caixa aberto"}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Funcionários Ativos</h2>
              {isLoadingEmployees ? (
                <Card className="h-full">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {Array(3).fill(0).map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <Skeleton className="h-8 w-8 rounded-full mr-3" />
                            <Skeleton className="h-5 w-32" />
                          </div>
                          <Skeleton className="h-4 w-40" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ) : (
                <Card className="h-full">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {employees && employees.length > 0 ? (
                        employees.slice(0, 5).map((employee: Employee, index: number) => (
                          <div
                            key={employee._id}
                            className="flex items-center justify-between p-4"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                {index + 1}
                              </div>
                              <div>{employee.name}</div>
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {employee.email}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          Nenhum funcionário encontrado.
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <Button variant="ghost" size="sm" asChild className="w-full">
                      <Link href="/employees">Ver Todos os Funcionários</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Pedidos Recentes</h2>
              {isLoadingOrders ? (
                <Card className="h-full">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {Array(3).fill(0).map((_, index) => (
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
                  <CardFooter className="border-t px-6 py-3">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ) : (
                <Card className="h-full">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {recentOrders && recentOrders.length > 0 ? (
                        recentOrders.map((order: Order) => (
                          <div
                            key={order._id}
                            className="flex items-center justify-between p-4"
                          >
                            <div>
                              <div className="font-medium">
                                {getClientName(order.clientId)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(order.orderDate)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(order.finalPrice)}</div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusClass(order.status as OrderStatus)}`}>
                                {translateOrderStatus(order.status as OrderStatus)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          Nenhum pedido recente encontrado.
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <Button variant="ghost" size="sm" asChild className="w-full">
                      <Link href="/orders">Ver Todos os Pedidos</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {isEmployee && (
        <>
          <h2 className="text-xl font-semibold mt-8">Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <Link href="/customers/new">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center">
                  <UserPlus className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-medium text-center">Novo Cliente</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/orders/new">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-medium text-center">Novo Pedido</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/products/new">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center">
                  <Package className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-medium text-center">Novo Produto</h3>
                </CardContent>
              </Card>
            </Link>

            <Link href="/cash-register">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center">
                  <DollarSign className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-medium text-center">Caixa</h3>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Pedidos Recentes</h2>
              {isLoadingOrders ? (
                renderListSkeleton(5)
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {recentOrders && recentOrders.length > 0 ? (
                        recentOrders.map((order: Order) => (
                          <div
                            key={order._id}
                            className="flex items-center justify-between p-4"
                          >
                            <div>
                              <div className="font-medium">
                                {getClientName(order.clientId)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(order.orderDate)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(order.finalPrice)}</div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusClass(order.status as OrderStatus)}`}>
                                {translateOrderStatus(order.status as OrderStatus)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          Nenhum pedido recente encontrado.
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <Button variant="ghost" size="sm" asChild className="w-full">
                      <Link href="/orders">Ver Todos os Pedidos</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Resumo do Caixa</h2>
              {isLoadingCashRegister ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-32 mb-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, index) => (
                        <div key={index} className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {currentCashRegister?.status === 'open' 
                        ? 'Caixa Aberto' 
                        : 'Caixa Fechado'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentCashRegister?.status === 'open' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Saldo Atual:</span>
                          <span className="font-semibold">{formatCurrency(currentCashRegister.currentBalance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vendas (Dinheiro):</span>
                          <span>{formatCurrency(currentCashRegister.sales.cash)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vendas (Cartão):</span>
                          <span>{formatCurrency(currentCashRegister.sales.credit + currentCashRegister.sales.debit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vendas (PIX):</span>
                          <span>{formatCurrency(currentCashRegister.sales.pix)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <p className="text-muted-foreground">
                          Não há nenhum caixa aberto no momento.
                        </p>
                        <Button className="mt-4" asChild>
                          <Link href="/cash-register/open">Abrir Caixa</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  {currentCashRegister?.status === 'open' && (
                    <CardFooter className="border-t">
                      <Button variant="ghost" size="sm" asChild className="w-full">
                        <Link href="/cash-register">Ver Detalhes do Caixa</Link>
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Conteúdo específico para Clientes */}
      {isCustomer && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Seus Pedidos</h2>
              {isLoadingCustomerOrders ? (
                renderListSkeleton(3)
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {customerOrders && customerOrders.length > 0 ? (
                        customerOrders.slice(0, 5).map((order: Order) => (
                          <div
                            key={order._id}
                            className="flex items-center justify-between p-4"
                          >
                            <div>
                              <div className="font-medium">
                                {order.products && order.products.length > 0
                                  ? (typeof order.products[0] === 'object' && 'name' in order.products[0]
                                    ? order.products[0].name
                                    : "Pedido")
                                  : "Pedido"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {order.deliveryDate
                                  ? `Entrega prevista: ${formatDate(order.deliveryDate)}`
                                  : `Pedido em: ${formatDate(order.orderDate)}`}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusClass(order.status as OrderStatus)}`}>
                                {translateOrderStatus(order.status as OrderStatus)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          Você não possui pedidos recentes.
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <Button variant="ghost" size="sm" asChild className="w-full">
                      <Link href="/my-orders">Ver Todos os Pedidos</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Situação Financeira</h2>
              {isLoadingLegacyClient ? (
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      {Array(3).fill(0).map((_, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Skeleton className="h-5 w-5 mr-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Seu Saldo</CardTitle>
                    <CardDescription>
                      Resumo de suas pendências financeiras
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          <span>Débito Atual</span>
                        </div>
                        <span className="font-bold text-red-500">
                          {legacyClient ? formatCurrency(legacyClient.totalDebt) : "R$ 0,00"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <CalendarCheck className="h-5 w-5 text-yellow-500 mr-2" />
                          <span>Último Pagamento</span>
                        </div>
                        <span className="font-medium">
                          {legacyClient?.lastPayment 
                            ? formatDate(legacyClient.lastPayment.date) 
                            : "Sem pagamentos"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <ShoppingBag className="h-5 w-5 text-green-500 mr-2" />
                          <span>Status da Conta</span>
                        </div>
                        <span className={`font-medium ${
                          legacyClient?.status === 'active' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {legacyClient?.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <Button variant="ghost" size="sm" asChild className="w-full">
                      <Link href="/my-debts">Ver Extrato Completo</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Informações e Avisos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-500" />
                    Cuide dos seus óculos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Recomendamos a limpeza regular de suas lentes com os produtos adequados 
                    e a revisão de suas armações a cada 6 meses para garantir maior durabilidade 
                    e conforto no uso diário.
                  </p>
                </CardContent>
                <CardFooter className="border-t px-6 py-3">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/products?category=clean_lenses">Ver produtos de limpeza</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Store className="h-5 w-5 mr-2 text-purple-500" />
                    Promoções do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Neste mês, oferecemos 15% de desconto em todas as armações de grau 
                    e óculos de sol. Além disso, na compra de lentes multifocais, você 
                    ganha um estojo personalizado.
                  </p>
                </CardContent>
                <CardFooter className="border-t px-6 py-3">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/products">Ver Produtos em Promoção</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}