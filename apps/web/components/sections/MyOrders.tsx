import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: number;
}

export const MyOrders = () => {
  // Dados de exemplo - substitua por dados reais da API
  const orders: Order[] = [
    {
      id: "ORD001",
      date: "2024-02-20",
      status: "Entregue",
      total: 599.99,
      items: 2,
    },
    {
      id: "ORD002",
      date: "2024-02-18",
      status: "Em processamento",
      total: 299.99,
      items: 1,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Pedidos</CardTitle>
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
                    {new Date(order.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="px-2 py-1 text-sm rounded-full bg-primary/10 text-primary">
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  {order.items} {order.items === 1 ? "item" : "itens"}
                </span>
                <span className="font-medium">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
