import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

interface PaymentEntry {
  date: Date;
  amount: number;
  paymentId: string;
}

interface PaymentHistoryTableProps {
  paymentHistory: PaymentEntry[];
  isLoading: boolean;
}

export function PaymentHistoryTable({
  paymentHistory,
  isLoading,
}: PaymentHistoryTableProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!paymentHistory || !paymentHistory.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        Nenhum pagamento encontrado.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>ID do Pagamento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentHistory.map((payment, index) => (
            <TableRow key={index}>
              <TableCell>{formatDate(payment.date)}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {payment.paymentId.substring(0, 10)}...
              </TableCell>
              <TableCell className="text-right">
                <Link 
                  href={`/dashboard/payments/${payment.paymentId}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Ver detalhes
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>ID do Pagamento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}