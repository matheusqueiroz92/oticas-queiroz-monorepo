import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { LegacyClient } from "@/app/_types/legacy-client";
import { Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LegacyClientsTableProps {
  clients: LegacyClient[];
  isLoading: boolean;
  onViewDetails: (id: string) => void;
}

export function LegacyClientsTable({
  clients,
  isLoading,
  onViewDetails,
}: LegacyClientsTableProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!clients.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        Nenhum cliente encontrado.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Dívida</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client._id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>
                {client.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
              </TableCell>
              <TableCell>
                {client.phone
                  ? client.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
                  : "-"}
              </TableCell>
              <TableCell>
                <span className={client.totalDebt > 0 ? "text-red-600 font-medium" : "text-gray-600"}>
                  {formatCurrency(client.totalDebt)}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    client.status === "active"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }`}
                >
                  {client.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(client._id!)}
                  title="Ver detalhes"
                >
                  <Eye className="h-4 w-4" />
                </Button>
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
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Dívida</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}