"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, User, DollarSign, Pencil } from "lucide-react";
import { formatCurrency, translateOrderStatus } from "@/app/_utils/formatters";

import type { Order } from "@/app/_types/order";

interface RecentOrdersCardProps {
  orders: Order[];
  onViewDetails: (orderId: string) => void;
  isLoading?: boolean;
  getClientName: (clientId: string) => string;
}

export function RecentOrdersCard({ 
  orders, 
  onViewDetails, 
  isLoading,
  getClientName
}: RecentOrdersCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_production":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "delivered":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Meus Últimos Pedidos Realizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="w-full">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-[var(--primary-blue)]" />
            Meus Últimos Pedidos Realizados
          </CardTitle>
          <Link href="/my-orders">
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Pedidos que você realizou recentemente
        </p>
      </CardHeader>
      <CardContent className="p-0 w-full">
        {orders.length > 0 ? (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nº O.S.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status do Pedido
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.slice(0, 3).map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order.serviceOrder}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {getClientName(order.clientId)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(order.orderDate.toString())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(order.finalPrice)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(order.status)} border`}
                      >
                        {translateOrderStatus(order.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      onClick={() => onViewDetails(order._id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {}}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                    </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-sm">
              Não há pedidos para exibir no momento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 