import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { IPayment } from "@/app/_types/payment";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";

interface CashRegisterPaymentsTableProps {
  title: string;
  description: string;
  payments: IPayment[];
  translatePaymentType: (type: string) => string;
  translatePaymentMethod: (method: string) => string;
  getPaymentTypeClass: (type: string) => string;
  showCategory?: boolean;
}

export function CashRegisterPaymentsTable({
  title,
  description,
  payments,
  translatePaymentType,
  translatePaymentMethod,
  getPaymentTypeClass,
  showCategory = false,
}: CashRegisterPaymentsTableProps) {
  const router = useRouter();

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            Nenhum pagamento registrado para este caixa.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Método</TableHead>
              {showCategory && <TableHead>Categoria</TableHead>}
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>
                  {payment.description ||
                    `Pagamento #${payment._id.substring(0, 8)}`}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getPaymentTypeClass(payment.type)}
                  >
                    {translatePaymentType(payment.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {translatePaymentMethod(payment.paymentMethod)}
                </TableCell>
                {showCategory && (
                  <TableCell>
                    {payment.category || "Não categorizada"}
                  </TableCell>
                )}
                <TableCell>{formatDate(payment.date)}</TableCell>
                <TableCell
                  className={
                    payment.type === "expense"
                      ? "text-red-600 font-medium"
                      : "text-green-600 font-medium"
                  }
                >
                  {payment.type === "expense" ? "-" : "+"}
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/payments/${payment._id}`)
                    }
                  >
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}