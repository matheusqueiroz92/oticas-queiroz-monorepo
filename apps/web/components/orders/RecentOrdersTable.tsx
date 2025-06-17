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
  getEmployeeName: (id: string) => string;
}

export const RecentOrdersTable = ({ orders, onViewDetails, getEmployeeName }: RecentOrdersTableProps) => {

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
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
            <TableCell>{getEmployeeName(order.clientId)}</TableCell>
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
              >
                <Eye />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};