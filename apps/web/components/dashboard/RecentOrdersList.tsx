"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
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
    <Card className="h-[600px] flex flex-col">
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
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {isLoadingOrders ? (
          <div className="divide-y flex-1">
            <RenderListSkeleton rows={5} />
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="divide-y flex-1 overflow-y-auto">
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
          <div className="p-8 text-center text-muted-foreground flex-1 flex items-center justify-center">
            <div>
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pedido encontrado</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 