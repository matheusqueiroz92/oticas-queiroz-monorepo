import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationItems } from "@/components/PaginationItems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import type { ICashRegister } from "@/app/_types/cash-register";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { useUsers } from "@/hooks/useUsers";

interface CashRegisterTableSectionProps {
  cashRegisters: ICashRegister[];
  onDetailsClick: (id: string) => void;
  onCloseClick: (id: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  pageSize: number;
  isLoading: boolean;
  hasActiveRegister: boolean;
}

export function CashRegisterTableSection({
  cashRegisters,
  onDetailsClick,
  onCloseClick,
  currentPage,
  totalPages,
  setCurrentPage,
  totalItems,
  pageSize,
  isLoading,
  hasActiveRegister,
}: CashRegisterTableSectionProps) {
  const { getUserName } = useUsers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cashRegisters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
        <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">
          Nenhum caixa encontrado
        </h3>
        <p className="text-muted-foreground mt-2">
          {hasActiveRegister 
            ? "Não há caixas fechados no período selecionado."
            : "Clique em 'Abrir Caixa' para iniciar um novo caixa."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Saldo Inicial</TableHead>
            <TableHead>Saldo Final</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cashRegisters.map((register) => (
            <TableRow key={register._id}>
              <TableCell>{formatDate(register.openingDate)}</TableCell>
              <TableCell>{getUserName(register.openedBy)}</TableCell>
              <TableCell>
                {formatCurrency(register.openingBalance)}
              </TableCell>
              <TableCell>
                {register.status === "closed"
                  ? formatCurrency(register.closingBalance || 0)
                  : formatCurrency(register.currentBalance)}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    register.status === "open"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                  }
                >
                  {register.status === "open" ? "Aberto" : "Fechado"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDetailsClick(register._id)}
                  >
                    <ClipboardList className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                  {register.status === "open" && (
                    <Button
                      size="sm"
                      onClick={() => onCloseClick(register._id)}
                    >
                      Fechar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PaginationItems
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        pageSize={pageSize}
      />
    </div>
  );
}