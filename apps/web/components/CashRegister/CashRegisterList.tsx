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
import { ClipboardList } from "lucide-react";
import type { ICashRegister } from "@/app/_types/cash-register";
import { formatCurrency, formatDate } from "@/app/_utils/formatters";
import { useUsers } from "@/hooks/useUsers";

interface CashRegisterListProps {
  cashRegisters: ICashRegister[];
  currentPage: number;
  totalPages: number;
  totalRegisters: number;
  onDetailsClick: (id: string) => void;
  onCloseClick: (id: string) => void;
  setCurrentPage: (page: number) => void;
}

export function CashRegisterList({
  cashRegisters,
  currentPage,
  totalPages,
  totalRegisters,
  onDetailsClick,
  onCloseClick,
  setCurrentPage,
}: CashRegisterListProps) {
  const { getUserName } = useUsers();

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
        totalItems={totalRegisters}
        pageSize={cashRegisters.length}
      />
    </div>
  );
}