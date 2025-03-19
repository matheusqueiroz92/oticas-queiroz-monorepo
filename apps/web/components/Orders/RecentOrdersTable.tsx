import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Order } from "@/app/types/order";
import { formatCurrency, formatDate } from "@/app/services/orderService";

interface RecentOrdersTableProps {
  orders: Order[];
  onViewDetails: (id: string) => void;
}

export const RecentOrdersTable = ({ orders, onViewDetails }: RecentOrdersTableProps) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum pedido recente encontrado
      </div>
    );
  }

  // Mostrar apenas os 5 pedidos mais recentes
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentOrders.map((order) => (
            <TableRow key={order._id}>
              <TableCell>#{order._id.substring(0, 8)}</TableCell>
              <TableCell>{order.clientId}</TableCell>
              <TableCell>
                {formatDate(order.createdAt)}
              </TableCell>
              <TableCell>
                <span className={getStatusClass(order.status)}>
                  {translateStatus(order.status)}
                </span>
              </TableCell>
              <TableCell>
                {formatCurrency(order.finalPrice)}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(order._id)}
                >
                  Ver detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Função auxiliar para traduzir status
function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'in_production': 'Em Produção',
    'ready': 'Pronto',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado'
  };
  return statusMap[status] || status;
}

// Função auxiliar para obter classe de estilo do status
function getStatusClass(status: string): string {
  switch (status) {
    case "pending":
      return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
    case "in_production":
      return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
    case "ready":
      return "text-green-600 bg-green-100 px-2 py-1 rounded";
    case "delivered":
      return "text-purple-600 bg-purple-100 px-2 py-1 rounded";
    case "cancelled":
      return "text-red-600 bg-red-100 px-2 py-1 rounded";
    default:
      return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
  }
}