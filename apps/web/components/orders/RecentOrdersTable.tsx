import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Order } from "@/app/_types/order";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { Eye } from "lucide-react";

interface RecentOrdersTableProps {
  orders: Order[];
  onViewDetails: (id: string) => void;
  getEmployeeName: (order: Order) => string;
}

export const RecentOrdersTable = ({ orders, onViewDetails, getEmployeeName }: RecentOrdersTableProps) => {

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Nenhum pedido recente encontrado
      </div>
    );
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pedido</TableHead>
          <TableHead>O.S.</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Total</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentOrders.map((order) => (
          <TableRow key={order._id}>
            <TableCell>#{order._id.substring(0, 8)}</TableCell>
            <TableCell>{(order.serviceOrder ?? "").substring(0, 8)}</TableCell>
            <TableCell>{getEmployeeName(order)}</TableCell>
            <TableCell>
              {formatDate(order.createdAt)}
            </TableCell>
            <TableCell>
              {formatCurrency(order.finalPrice)}
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(order._id)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};