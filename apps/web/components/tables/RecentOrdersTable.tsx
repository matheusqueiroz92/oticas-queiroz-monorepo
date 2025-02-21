import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  customer: string;
  date: string;
  status: string;
  total: number;
}

export const RecentOrdersTable = () => {
  // Dados de exemplo - substitua por dados reais da API
  const orders: Order[] = [
    {
      id: "ORD001",
      customer: "João Silva",
      date: "2024-02-20",
      status: "Entregue",
      total: 599.99,
    },
    {
      id: "ORD002",
      customer: "Maria Santos",
      date: "2024-02-19",
      status: "Pendente",
      total: 299.99,
    },
    {
      id: "ORD003",
      customer: "Pedro Oliveira",
      date: "2024-02-18",
      status: "Em processamento",
      total: 899.99,
    },
  ];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.id}</TableCell>
              <TableCell>{order.customer}</TableCell>
              <TableCell>
                {new Date(order.date).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {order.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                R$ {order.total.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
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
