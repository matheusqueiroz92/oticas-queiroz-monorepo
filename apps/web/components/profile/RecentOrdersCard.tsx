"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Eye, Calendar, User, DollarSign } from "lucide-react";
import { formatCurrency, translateOrderStatus, getOrderStatusClass } from "@/app/_utils/formatters";

import type { Order } from "@/app/_types/order";

interface RecentOrdersCardProps {
  orders: Order[];
  onViewDetails: (orderId: string) => void;
  isLoading?: boolean;
  getClientName: (clientId: string) => string;
  userRole?: string;
}

export function RecentOrdersCard({
  orders,
  onViewDetails,
  isLoading,
  getClientName,
  userRole,
}: RecentOrdersCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isClient = userRole === "customer";

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-[var(--primary-blue)]/5 to-transparent dark:from-slate-800/70 dark:to-slate-800/30 border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold text-[var(--primary-blue)] dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Últimos Pedidos Realizados
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-[var(--primary-blue)]/5 to-transparent dark:from-slate-800/70 dark:to-slate-800/30 border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-[var(--primary-blue)] dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Últimos Pedidos Realizados
            </CardTitle>
            <CardDescription className="mt-0.5">
              Pedidos realizados recentemente
            </CardDescription>
          </div>
          <Link href="/my-orders">
            <Button variant="outline" size="sm" className="text-xs">
              Ver todos
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 w-full">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/40 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nº O.S.
                  </th>
                  {!isClient && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Cliente
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.slice(0, 3).map((order) => (
                  <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium">{order.serviceOrder}</span>
                    </td>
                    {!isClient && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm text-foreground/80">{getClientName(order.clientId)}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(order.orderDate.toString())}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className="text-sm font-medium">{formatCurrency(order.finalPrice)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={`status-badge ${getOrderStatusClass(order.status)} text-xs`}>
                        {translateOrderStatus(order.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onViewDetails(order._id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              title="Nenhum pedido encontrado"
              description="Não há pedidos para exibir no momento."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
