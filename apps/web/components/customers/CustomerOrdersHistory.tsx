import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/app/_utils/customer-details-utils";
import { getStatusBadge } from "@/app/_utils/order-status-config";
import type { Order } from "@/app/_types/order";

interface CustomerOrdersHistoryProps {
  filteredOrders: Order[];
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onViewOrder: (orderId: string) => void;
  onViewAllOrders: () => void;
  customerId: string;
}

export function CustomerOrdersHistory({
  filteredOrders,
  statusFilter,
  onStatusFilterChange,
  onViewOrder,
  onViewAllOrders,
}: CustomerOrdersHistoryProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pedidos Recentes
          </CardTitle>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="realizado">Entregue</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {filteredOrders.slice(0, 10).map((order, index) => (
            <div 
              key={order._id} 
              className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                index !== filteredOrders.slice(0, 10).length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">#{order.serviceOrder || order._id.slice(-8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt || order.orderDate)}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium line-clamp-1">
                  {order.products.length === 1 
                    ? order.products[0].name 
                    : `${order.products.length} produtos`
                  }
                </p>
                {order.products.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {order.products.map(p => p.name).join(", ").substring(0, 50)}...
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(order.finalPrice || 0)}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewOrder(order._id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="p-6 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {statusFilter === "todos" 
                ? "Nenhum pedido encontrado" 
                : `Nenhum pedido ${statusFilter === "realizado" ? "entregue" : statusFilter} encontrado`
              }
            </p>
          </div>
        )}

        {filteredOrders.length > 10 && (
          <div className="p-4 border-t border-border">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onViewAllOrders}
            >
              Ver todos os {filteredOrders.length} pedidos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 