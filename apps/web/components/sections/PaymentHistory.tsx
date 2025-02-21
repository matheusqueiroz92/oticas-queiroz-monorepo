import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Payment {
  id: string;
  date: string;
  method: string;
  amount: number;
  status: string;
}

export const PaymentHistory = () => {
  // Dados de exemplo - substitua por dados reais da API
  const payments: Payment[] = [
    {
      id: "PAY001",
      date: "2024-02-20",
      method: "Cartão de Crédito",
      amount: 599.99,
      status: "Aprovado",
    },
    {
      id: "PAY002",
      date: "2024-02-18",
      method: "PIX",
      amount: 299.99,
      status: "Aprovado",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pagamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border rounded-lg p-4 hover:bg-accent transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">Pagamento #{payment.id}</h3>
                  <p className="text-sm text-muted-foreground">
                    {payment.method}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-sm rounded-full ${
                    payment.status === "Aprovado"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {payment.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  {new Date(payment.date).toLocaleDateString("pt-BR")}
                </span>
                <span className="font-medium">
                  R$ {payment.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
