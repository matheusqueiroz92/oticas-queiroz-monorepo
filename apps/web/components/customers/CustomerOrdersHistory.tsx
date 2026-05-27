import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Eye } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/app/_utils/customer-details-utils";
import { getOrderStatusClass, translateOrderStatus } from "@/app/_utils/formatters";
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
      <CardHeader className="bg-gradient-to-r from-[var(--primary-blue)]/5 to-transparent dark:from-slate-800/70 dark:to-slate-800/30 border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-[var(--primary-blue)] dark:text-zinc-100 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pedidos do Cliente
          </CardTitle>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[110px] sm:w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="realizado">Entregues</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredOrders.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="Nenhum pedido encontrado"
              description={
                statusFilter === "todos"
                  ? "Este cliente ainda não possui pedidos registrados."
                  : "Nenhum pedido com este status foi encontrado."
              }
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/60">
              {filteredOrders.slice(0, 10).map((order) => (
                <div
                  key={order._id}
                  className="p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          #{order.serviceOrder || order._id.slice(-8)}
                        </p>
                        <Badge className={`status-badge ${getOrderStatusClass(order.status)} text-xs`}>
                          {translateOrderStatus(order.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(order.createdAt || order.orderDate)}
                      </p>
                      <p className="text-sm font-medium mt-1.5 line-clamp-1 text-foreground/80">
                        {order.products.length === 1
                          ? order.products[0].name
                          : `${order.products.length} produtos`}
                      </p>
                      {order.products.length > 1 && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {order.products.map(p => p.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(order.finalPrice || 0)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewOrder(order._id)}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredOrders.length > 10 && (
              <div className="p-4 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={onViewAllOrders}
                >
                  Ver todos os {filteredOrders.length} pedidos
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
