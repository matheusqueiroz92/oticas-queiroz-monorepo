"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  CalendarIcon,
  FileText,
  Loader2,
  PlusCircle,
  ClipboardList,
  DollarSign,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

import { useCashRegister } from "../../../hooks/useCashRegister";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { PageTitle } from "@/components/PageTitle";
import { useUsers } from "@/hooks/useUsers";

export default function CashRegisterPage() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const {
    cashRegisters,
    activeRegister,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalRegisters,
    setCurrentPage,
    updateFilters,
    navigateToOpenRegister,
    navigateToRegisterDetails,
    navigateToCloseRegister,
  } = useCashRegister();

  const {
    getAllUsers,
    usersMap,
  } = useUsers();

  useEffect(() => {
    const loadAllUsers = async () => {
      await getAllUsers();
    };
    
    loadAllUsers();
  }, [getAllUsers]);
 
  const applyDateFilter = () => {
    if (date) {
      updateFilters({
        startDate: format(date, "yyyy-MM-dd"),
        endDate: format(date, "yyyy-MM-dd"),
      });
    }
  };

  const clearFilters = () => {
    updateFilters({});
    setDate(undefined);
    setSearch("");
  };

  const showEmptyState = !isLoading && !error && cashRegisters.length === 0;

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Controle de caixa"
        description="Gerencie e visualize os registros de caixa da loja"
      />

      {activeRegister && (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Caixa Aberto
            </CardTitle>
            <CardDescription>
              Aberto em {formatDate(activeRegister.openingDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-sm text-gray-500">Saldo Inicial</div>
                <div className="text-lg font-bold text-blue-700">
                  {formatCurrency(activeRegister.openingBalance)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-sm text-gray-500">Saldo Atual</div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(activeRegister.currentBalance)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-sm text-gray-500">Total de Vendas</div>
                <div className="text-lg font-bold text-gray-700">
                  {formatCurrency(activeRegister.sales?.total || 0)}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => navigateToRegisterDetails(activeRegister._id)}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Detalhes
            </Button>
            <Button onClick={() => navigateToCloseRegister(activeRegister._id)}>
              Fechar Caixa
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar por data ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 px-3">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {date
                  ? format(date, "dd/MM/yyyy", { locale: ptBR })
                  : "Filtrar por data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
              <div className="p-3 border-t border-border flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDate(undefined)}
                >
                  Limpar
                </Button>
                <Button size="sm" onClick={applyDateFilter}>
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={clearFilters} className="h-10">
            Limpar Filtros
          </Button>
        </div>

        {!activeRegister && (
          <Button onClick={navigateToOpenRegister}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Abrir Caixa
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>
      )}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Não há registros de caixa</h3>
          <p className="text-muted-foreground mt-2">
            Nenhum registro de caixa foi encontrado.
          </p>
          {!activeRegister && (
            <Button className="mt-4" onClick={navigateToOpenRegister}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Abrir Caixa
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && cashRegisters.length > 0 && (
        <>
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
                  <TableCell>{usersMap[register.openedBy]?.name || register.openedBy}</TableCell>
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
                        onClick={() => navigateToRegisterDetails(register._id)}
                      >
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      {register.status === "open" && (
                        <Button
                          size="sm"
                          onClick={() => navigateToCloseRegister(register._id)}
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
        </>
      )}
    </div>
  );
}
