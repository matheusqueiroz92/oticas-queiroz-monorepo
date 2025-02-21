import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  customer: string;
  date: string;
  status: string;
  total: number;
}

export const OrderManagement = () => {
  // Dados de exemplo - substitua por dados reais da API
  const orders: OrderItem[] = [
    {
      id: "ORD001",
      customer: "João Silva",
      date: "2024-02-20",
      status: "Pendente",
      total: 599.99,
    },
    {
      id: "ORD002",
      customer: "Maria Santos",
      date: "2024-02-18",
      status: "Em processamento",
      total: 299.99,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 hover:bg-accent transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">Pedido #{order.id}</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.customer}
                  </p>
                </div>
                <span className="px-2 py-1 text-sm rounded-full bg-primary/10 text-primary">
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm">
                  <span className="block">
                    {new Date(order.date).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="font-medium">
                    R$ {order.total.toFixed(2)}
                  </span>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    Ver detalhes
                  </Button>
                  <Button size="sm">Atualizar status</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
