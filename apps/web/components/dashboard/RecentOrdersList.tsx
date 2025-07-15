"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, ShoppingBag } from "lucide-react";
import { formatCurrency, getOrderStatusClass, translateOrderStatus } from "@/app/_utils/formatters";
import { RenderListSkeleton } from "@/components/dashboard/RenderListSkeleton";
import type { Order } from "@/app/_types/order";

interface RecentOrdersListProps {
  recentOrders: Order[];
  isLoadingOrders: boolean;
  getClientName: (clientId: string) => string;
}

export function RecentOrdersList({
  recentOrders,
  isLoadingOrders,
  getClientName,
}: RecentOrdersListProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50 ">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[var(--primary-blue)]" />
              Pedidos Recentes
            </CardTitle>
            <CardDescription>Útimos pedidos realizados no sistema</CardDescription>
          </div>
          <Link href="/orders">
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {isLoadingOrders ? (
          <div className="divide-y flex-1">
            <RenderListSkeleton rows={5} />
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="divide-y flex-1 overflow-y-auto">
            {recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between p-3">
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
          <div className="p-6 text-center text-muted-foreground flex-1 flex items-center justify-center">
            <div>
              <ShoppingBag className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum pedido encontrado</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 