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
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Star,
  Calendar,
  CreditCard,
  Gift,
  Eye,
  Package,
  Percent,
  Bell,
  Trophy
} from "lucide-react";
import { useDebts } from "@/hooks/useDebts";
import { useOrders } from "@/hooks/orders/useOrders";
import { useProfile } from "@/hooks/profile/useProfile";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";

interface CustomerDashboardProps {
  userName?: string;
  isLoadingLegacyClient?: boolean;
  legacyClient?: any;
}

export function CustomerDashboard({
  userName,
}: CustomerDashboardProps) {
  const [showPromotions, setShowPromotions] = useState(true);
  
  // Hooks para buscar dados
  const { debtsData, isLoading: isLoadingDebts } = useDebts();
  const { useMyOrders } = useOrders();
  const { profile: user } = useProfile();
  
  const {
    data: myOrders = [],
    isLoading: isLoadingOrders,
  } = useMyOrders();

  // Cálculos baseados nos dados reais
  const totalOrders = myOrders.length;
  const totalSpent = myOrders.reduce((total, order) => total + (order.finalPrice || 0), 0);
  const completedOrders = myOrders.filter(order => order.status === 'delivered').length;
  const pendingOrders = myOrders.filter(order => 
    order.status === 'pending' || order.status === 'in_production' || order.status === 'ready'
  ).length;
  
  // Status do cliente baseado no valor gasto
  const getCustomerStatus = (spent: number) => {
    if (spent >= 10000) return { status: "Premium", color: "bg-purple-100 text-purple-800", icon: Trophy };
    if (spent >= 5000) return { status: "Ouro", color: "bg-yellow-100 text-yellow-800", icon: Star };
    if (spent >= 2000) return { status: "Prata", color: "bg-gray-100 text-gray-800", icon: Star };
    return { status: "Bronze", color: "bg-orange-100 text-orange-800", icon: Star };
  };

  const customerStatus = getCustomerStatus(totalSpent);
  const StatusIcon = customerStatus.icon;

  // Promoções fictícias para demonstrar
  const promotions = [
    {
      id: 1,
      title: "Desconto de 20% em Lentes",
      description: "Válido para armações de grau até o fim do mês",
      discount: "20%",
      validUntil: "31/12/2024",
      code: "LENTES20"
    },
    {
      id: 2,
      title: "Troca de Lentes Grátis",
      description: "Na compra de 2 pares de óculos",
      discount: "Grátis",
      validUntil: "15/01/2025",
      code: "TROCA2X1"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header de boas-vindas */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-900">
                Bem-vindo, {userName || "Cliente"}! 👋
              </CardTitle>
              <CardDescription className="text-blue-700 mt-2">
                Aqui você pode acompanhar seus pedidos, débitos e muito mais.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-6 w-6 text-blue-600" />
              <Badge className={customerStatus.color}>
                Status: {customerStatus.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Gasto"
          value={isLoadingOrders ? "..." : formatCurrency(totalSpent)}
          icon={DollarSign}
          iconColor="text-green-600"
          bgColor="bg-green-100 dark:bg-green-900"
          badge={{
            text: "histórico",
            className: "bg-green-500 text-white border-0"
          }}
          isLoading={isLoadingOrders}
        />

        <StatCard
          title="Pedidos Feitos"
          value={isLoadingOrders ? "..." : totalOrders.toString()}
          icon={ShoppingBag}
          iconColor="text-blue-600"
          bgColor="bg-blue-100 dark:bg-blue-900"
          badge={{
            text: `${completedOrders} entregues`,
            className: "bg-blue-500 text-white border-0"
          }}
          isLoading={isLoadingOrders}
        />

        <StatCard
          title="Débito Atual"
          value={isLoadingDebts ? "..." : formatCurrency(debtsData.totalDebt)}
          icon={CreditCard}
          iconColor="text-red-600"
          bgColor="bg-red-100 dark:bg-red-900"
          badge={{
            text: `${debtsData.orders.length} em aberto`,
            className: "bg-red-500 text-white border-0"
          }}
          isLoading={isLoadingDebts}
        />

        <StatCard
          title="Pedidos Pendentes"
          value={isLoadingOrders ? "..." : pendingOrders.toString()}
          icon={Clock}
          iconColor="text-orange-600"
          bgColor="bg-orange-100 dark:bg-orange-900"
          badge={{
            text: "aguardando",
            className: "bg-orange-500 text-white border-0"
          }}
          isLoading={isLoadingOrders}
        />
      </div>

      {/* Grid principal com conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna esquerda - Pedidos recentes */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pedidos Recentes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Seus Pedidos Recentes
                </CardTitle>
                <Link href="/my-orders">
                  <Button variant="outline" size="sm">
                    Ver todos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : myOrders.length > 0 ? (
                <div className="space-y-3">
                  {myOrders.slice(0, 3).map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium">
                          Pedido #{order.serviceOrder || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.createdAt)} • Status: {order.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(order.finalPrice)}
                        </p>
                        <Link href={`/orders/${order._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum pedido encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Promoções */}
          {showPromotions && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Gift className="h-5 w-5" />
                    Promoções Especiais
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPromotions(false)}
                    className="text-green-700 hover:text-green-900"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-800 flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            {promo.title}
                          </h4>
                          <p className="text-sm text-green-700 mt-1">
                            {promo.description}
                          </p>
                          <p className="text-xs text-green-600 mt-2">
                            Válido até: {promo.validUntil} • Código: <strong>{promo.code}</strong>
                          </p>
                        </div>
                        <Badge className="bg-green-600 text-white">
                          {promo.discount}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

                 {/* Coluna direita - Informações da conta */}
         <div className="space-y-6">
           
           {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-blue-600" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className={customerStatus.color}>
                  {customerStatus.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Membro desde:</span>
                <span>{user?.createdAt ? formatDate(user.createdAt) : "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total de pedidos:</span>
                <span className="font-semibold">{totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Valor total gasto:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Dicas e Suporte */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dicas e Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-2">
              <p>• Acompanhe seus pedidos em tempo real</p>
              <p>• Verifique seus débitos regularmente</p>
              <p>• Entre em contato conosco para dúvidas</p>
              <p>• Aproveite nossas promoções exclusivas</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 