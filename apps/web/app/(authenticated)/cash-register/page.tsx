"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../services/auth";
import { useToast } from "@/hooks/use-toast";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  FileText,
  Loader2,
  PlusCircle,
  Search,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";

import type { CashRegister } from "@/app/types/cash-register";

interface SearchParams {
  search?: string;
  page?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export default function CashRegisterPage() {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegisters, setTotalRegisters] = useState(0);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(
    null
  );
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [filter, setFilter] = useState<{
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }>({});

  const router = useRouter();
  const { toast } = useToast();

  const fetchCashRegisters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: SearchParams = {
        search,
        page: currentPage,
        status: filter.status,
        startDate: filter.startDate
          ? format(filter.startDate, "yyyy-MM-dd")
          : undefined,
        endDate: filter.endDate
          ? format(filter.endDate, "yyyy-MM-dd")
          : undefined,
      };

      try {
        // Primeiro, tente buscar o caixa atual aberto
        let activeCashRegister = null;
        try {
          const currentResponse = await api.get("/api/cash-registers/current");
          if (currentResponse.data && currentResponse.data.status === "open") {
            activeCashRegister = currentResponse.data;
            setActiveRegister(activeCashRegister);
          }
        } catch (currentError) {
          console.log("Não foi possível buscar o caixa atual:", currentError);
        }

        // Em seguida, tente buscar todos os registros de caixa
        try {
          const response = await api.get("/api/cash-registers", { params });

          // Verificar se a resposta tem o formato esperado
          if (response.data?.cashRegisters) {
            setCashRegisters(response.data.cashRegisters);

            // Extrair informações de paginação
            if (response.data.pagination) {
              setTotalPages(response.data.pagination.totalPages || 1);
              setTotalRegisters(
                response.data.pagination.total ||
                  response.data.cashRegisters.length
              );
            }
          } else if (Array.isArray(response.data)) {
            // Caso a API retorne diretamente um array
            setCashRegisters(response.data);
            setTotalPages(1);
            setTotalRegisters(response.data.length);
          } else {
            // Se chegou aqui e já temos o caixa ativo, mas nenhum registro
            // então adicione o caixa ativo ao array
            if (activeCashRegister) {
              setCashRegisters([activeCashRegister]);
              setTotalPages(1);
              setTotalRegisters(1);
            } else {
              // Caso não tenha dados
              setCashRegisters([]);
              setTotalPages(1);
              setTotalRegisters(0);
            }
          }

          // Verificar se há um caixa aberto na listagem, se ainda não foi definido
          if (!activeCashRegister) {
            let active = null;
            if (Array.isArray(response.data?.cashRegisters)) {
              active = response.data.cashRegisters.find(
                (reg: CashRegister) => reg.status === "open"
              );
            } else if (Array.isArray(response.data)) {
              active = response.data.find(
                (reg: CashRegister) => reg.status === "open"
              );
            }
            setActiveRegister(active || null);
          }
        } catch (listError) {
          console.log("Erro ao buscar lista de caixas:", listError);

          // Se temos um caixa ativo, mas a listagem falhou
          if (activeCashRegister) {
            setCashRegisters([activeCashRegister]);
            setTotalPages(1);
            setTotalRegisters(1);
          } else {
            setCashRegisters([]);
            setTotalPages(1);
            setTotalRegisters(0);
          }
        }
      } catch (apiError) {
        console.error("Erro na chamada à API:", apiError);
        // Caso específico de erro na API que não seja problema de conexão
        const errorMessage =
          apiError instanceof Error
            ? apiError.message
            : "Erro desconhecido ao carregar registros";

        setError(`Erro ao carregar registros de caixa. ${errorMessage}`);
        setCashRegisters([]);
        setTotalPages(1);
        setTotalRegisters(0);
      }
    } catch (error) {
      console.error("Erro geral na função fetchCashRegisters:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      setError(`Erro ao carregar registros de caixa. ${errorMessage}`);
      setCashRegisters([]);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    currentPage,
    filter,
    setActiveRegister,
    setCashRegisters,
    setError,
    setLoading,
    setTotalPages,
    setTotalRegisters,
  ]);

  // Adicione esta função à página para buscar apenas o caixa atual ativo (se houver)
  const fetchActiveCashRegister = async () => {
    try {
      const response = await api.get("/api/cash-registers/current");
      if (response.data && response.data.status === "open") {
        setActiveRegister(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.log("Não há caixa aberto no momento.");
      return false;
    }
  };

  const safeFormatDate = (
    dateInput: string | Date | undefined,
    formatString = "dd/MM/yyyy",
    locale = ptBR
  ) => {
    if (!dateInput) return "Data não disponível";

    try {
      // Se for string, tenta converter para Date
      const date =
        typeof dateInput === "string" ? new Date(dateInput) : dateInput;

      // Verificar se a data é válida
      if (Number.isNaN(date.getTime())) {
        return "Data inválida";
      }

      return format(date, formatString, { locale });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  // Função para formatar valor monetário
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para aplicar filtro de data
  const applyDateFilter = () => {
    if (date) {
      setFilter({ ...filter, startDate: date, endDate: date });
    }
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setFilter({});
    setDate(undefined);
    setSearch("");
  };

  // Função para gerar itens de paginação
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      return items;
    }

    // Caso contrário, mostrar um subconjunto com elipses
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Adicionar elipse se necessário
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Páginas próximas à atual
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (i <= 1 || i >= totalPages) continue;
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Adicionar elipse se necessário
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Última página
    items.push(
      <PaginationItem key={totalPages}>
        <PaginationLink
          onClick={() => setCurrentPage(totalPages)}
          isActive={currentPage === totalPages}
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );

    return items;
  };

  // No useEffect original, adicione uma chamada para tentar buscar o caixa atual
  // se a lista de caixas estiver vazia
  useEffect(() => {
    fetchCashRegisters();
  }, [fetchCashRegisters]);

  // Adicione outro useEffect para buscar apenas o caixa ativo quando necessário
  useEffect(() => {
    // Se não encontrou nenhum registro, mas não houve erro na API,
    // tente buscar apenas o caixa atual
    if (cashRegisters.length === 0 && !loading && !error) {
      fetchActiveCashRegister();
    }
  }, [cashRegisters, loading, error]);

  // Verificar estado vazio
  const showEmptyState = !loading && !error && cashRegisters.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Controle de Caixa</h1>

      {/* Dashboard com caixa ativo */}
      {activeRegister && (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Caixa Aberto
            </CardTitle>
            <CardDescription>
              Aberto em {safeFormatDate(activeRegister.date)} às{" "}
              {activeRegister.date
                ? safeFormatDate(activeRegister.date, "HH:mm")
                : "Horário não disponível"}
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
                  {formatCurrency(activeRegister.totalSales || 0)}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/cash-register/${activeRegister._id}`)
              }
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Detalhes
            </Button>
            <Button
              onClick={() =>
                router.push(`/cash-register/close/${activeRegister._id}`)
              }
            >
              Fechar Caixa
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Ações principais */}
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
          <Button onClick={() => router.push("/cash-register/open")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Abrir Caixa
          </Button>
        )}
      </div>

      {loading && (
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
            <Button
              className="mt-4"
              onClick={() => router.push("/cash-register/open")}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Abrir Caixa
            </Button>
          )}
        </div>
      )}

      {!loading && !error && cashRegisters.length > 0 && (
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
                  <TableCell>
                    {format(new Date(register.date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>{register.openedBy}</TableCell>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/cash-register/${register._id}`)
                      }
                    >
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      aria-disabled={currentPage === 1}
                      className={
                        currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                      }
                    />
                  </PaginationItem>

                  {generatePaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      aria-disabled={currentPage === totalPages}
                      className={
                        currentPage === totalPages
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="text-center text-sm text-gray-500 mt-2">
                Mostrando {cashRegisters.length} de {totalRegisters} registros
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
