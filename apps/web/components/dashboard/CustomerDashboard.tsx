"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Star,
  CreditCard,
  Gift,
  Eye,
  Package,
  Percent,
  Info,
  Trophy,
  X,
  CheckCircle2,
  MessageCircle,
  BarChart2,
} from "lucide-react";
import { useDebts } from "@/hooks/useDebts";
import { useOrders } from "@/hooks/orders/useOrders";
import { useProfile } from "@/hooks/profile/useProfile";
import { formatCurrency, formatDate, getOrderStatusClass, translateOrderStatus } from "@/app/_utils/formatters";

interface CustomerDashboardProps {
  userName?: string;
  isLoadingLegacyClient?: boolean;
  legacyClient?: any;
}

export function CustomerDashboard({
  userName,
}: CustomerDashboardProps) {
  const [showPromotions, setShowPromotions] = useState(true);

  const { debtsData, isLoading: isLoadingDebts } = useDebts();
  const { useMyOrders } = useOrders();
  const { profile: user } = useProfile();

  const {
    data: myOrders = [],
    isLoading: isLoadingOrders,
  } = useMyOrders();

  const totalOrders = myOrders.length;
  const totalSpent = myOrders.reduce((total, order) => total + (order.finalPrice || 0), 0);
  const completedOrders = myOrders.filter(order => order.status === "delivered").length;
  const pendingOrders = myOrders.filter(order =>
    order.status === "pending" || order.status === "in_production" || order.status === "ready"
  ).length;

  const getCustomerStatus = (spent: number) => {
    if (spent >= 10000) return { status: "Premium", className: "badge-purple", icon: Trophy };
    if (spent >= 5000) return { status: "Ouro", className: "badge-warning", icon: Star };
    if (spent >= 2000) return { status: "Prata", className: "badge-neutral", icon: Star };
    return { status: "Bronze", className: "badge-neutral", icon: Star };
  };

  const customerStatus = getCustomerStatus(totalSpent);
  const StatusIcon = customerStatus.icon;

  const promotions = [
    {
      id: 1,
      title: "Desconto de 20% em Lentes",
      description: "Válido para armações de grau até o fim do mês",
      discount: "20%",
      validUntil: "31/12/2024",
      code: "LENTES20",
    },
    {
      id: 2,
      title: "Troca de Lentes Grátis",
      description: "Na compra de 2 pares de óculos",
      discount: "Grátis",
      validUntil: "15/01/2025",
      code: "TROCA2X1",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header de boas-vindas */}
      <Card className="bg-gradient-to-r from-[var(--primary-blue)]/8 to-[var(--primary-blue)]/3 border-[var(--primary-blue)]/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-[var(--primary-blue)]/3 dark:bg-[var(--primary-blue)]/10 pointer-events-none" />
        <CardHeader className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl sm:text-2xl text-[var(--primary-blue)] dark:text-zinc-100 tracking-tight">
                Bem-vindo, {userName || "Cliente"}!
              </CardTitle>
              <CardDescription className="text-[var(--primary-blue)]/70 dark:text-zinc-400 mt-1">
                Acompanhe seus pedidos, débitos e muito mais.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusIcon className="h-5 w-5 text-[var(--primary-blue)] dark:text-zinc-300" />
              <Badge className={`status-badge ${customerStatus.className}`}>
                {customerStatus.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Gasto"
          value={isLoadingOrders ? "..." : formatCurrency(totalSpent)}
          icon={DollarSign}
          iconColor="text-green-600"
          bgColor="bg-green-100 dark:bg-green-900/30"
          badge={{ text: "histórico", className: "bg-green-500 text-white border-0" }}
          isLoading={isLoadingOrders}
        />
        <StatCard
          title="Pedidos Feitos"
          value={isLoadingOrders ? "..." : totalOrders.toString()}
          icon={ShoppingBag}
          iconColor="text-[var(--primary-blue)]"
          bgColor="bg-[var(--primary-blue)]/10"
          badge={{ text: `${completedOrders} entregues`, className: "bg-[var(--primary-blue)] text-white border-0" }}
          isLoading={isLoadingOrders}
        />
        <StatCard
          title="Débito Atual"
          value={isLoadingDebts ? "..." : formatCurrency(debtsData.totalDebt)}
          icon={CreditCard}
          iconColor="text-red-600"
          bgColor="bg-red-100 dark:bg-red-900/30"
          badge={{ text: `${debtsData.orders.length} em aberto`, className: "bg-red-500 text-white border-0" }}
          isLoading={isLoadingDebts}
        />
        <StatCard
          title="Pedidos Pendentes"
          value={isLoadingOrders ? "..." : pendingOrders.toString()}
          icon={Clock}
          iconColor="text-amber-600"
          bgColor="bg-amber-100 dark:bg-amber-900/30"
          badge={{ text: "aguardando", className: "bg-amber-500 text-white border-0" }}
          isLoading={isLoadingOrders}
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda — Pedidos recentes */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[var(--primary-blue)]/5 to-transparent dark:from-slate-800/70 dark:to-slate-800/30 border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[var(--primary-blue)] dark:text-zinc-100 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Seus Pedidos Recentes
                </CardTitle>
                <Link href="/my-orders">
                  <Button variant="outline" size="sm" className="text-xs">
                    Ver todos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingOrders ? (
                <div className="divide-y">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : myOrders.length > 0 ? (
                <div className="divide-y">
                  {myOrders.slice(0, 4).map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
                      <div>
                        <p className="font-medium text-sm">Pedido #{order.serviceOrder || "N/A"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="font-semibold text-sm">{formatCurrency(order.finalPrice)}</p>
                          <Badge className={`status-badge ${getOrderStatusClass(order.status)} text-xs mt-0.5`}>
                            {translateOrderStatus(order.status)}
                          </Badge>
                        </div>
                        <Link href={`/orders/${order._id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState
                    icon={<ShoppingBag className="h-8 w-8" />}
                    title="Nenhum pedido ainda"
                    description="Seus pedidos aparecerão aqui após serem realizados na loja."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Promoções */}
          {showPromotions && (
            <Card className="border-green-200/60 dark:border-green-800/40 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="bg-gradient-to-r from-green-500/8 to-transparent border-b border-green-200/50 dark:border-green-800/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Promoções Especiais
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPromotions(false)}
                    className="h-8 w-8 p-0 text-green-700 hover:text-green-900 hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {promotions.map((promo) => (
                  <div key={promo.id} className="bg-white dark:bg-slate-900/60 p-4 rounded-lg border border-green-200/60 dark:border-green-800/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2 text-sm">
                          <Percent className="h-3.5 w-3.5 shrink-0" />
                          {promo.title}
                        </h4>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">{promo.description}</p>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                          Válido até {promo.validUntil} — Código: <strong>{promo.code}</strong>
                        </p>
                      </div>
                      <Badge className="badge-success status-badge shrink-0">{promo.discount}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna direita — Informações da conta */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[var(--primary-blue)]/5 to-transparent dark:from-slate-800/70 dark:to-slate-800/30 border-b border-border/50 pb-4">
              <CardTitle className="text-base font-semibold text-[var(--primary-blue)] dark:text-zinc-100 flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Resumo da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nível do cliente</span>
                <Badge className={`status-badge ${customerStatus.className}`}>
                  {customerStatus.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Membro desde</span>
                <span className="font-medium">{user?.createdAt ? formatDate(user.createdAt) : "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total de pedidos</span>
                <span className="font-semibold">{totalOrders}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pedidos entregues</span>
                <span className="font-semibold text-green-600">{completedOrders}</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor total gasto</span>
                <span className="font-bold text-[var(--primary-blue)]">{formatCurrency(totalSpent)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Dicas e Suporte */}
          <Card className="border-[var(--primary-blue)]/15 dark:border-[var(--primary-blue)]/20 bg-[var(--primary-blue)]/3 dark:bg-[var(--primary-blue)]/8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[var(--primary-blue)] dark:text-zinc-200 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Dicas e Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--primary-blue)]/80 dark:text-zinc-400 space-y-2.5 pt-0">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
                <span>Acompanhe seus pedidos em tempo real</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
                <span>Verifique seus débitos regularmente</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
                <span>Aproveite nossas promoções exclusivas</span>
              </div>
              <div className="flex items-start gap-2">
                <MessageCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--primary-blue)]/60" />
                <span>Entre em contato conosco para dúvidas</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
