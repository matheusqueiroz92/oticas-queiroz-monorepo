"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, FileText, Ban } from "lucide-react";
import { api } from "../../services/auth";
import { Badge } from "@/components/ui/badge";
import type { Payment } from "../../types/payment";
import axios from "axios";

interface SearchParams {
  search?: string;
  page?: number;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [filter, setFilter] = useState<{
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const router = useRouter();

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: SearchParams = {
        search,
        page: currentPage,
        ...filter,
      };

      try {
        const response = await api.get("/api/payments", { params });

        // Verificar se a resposta tem o formato esperado
        if (response.data?.payments) {
          setPayments(response.data.payments);

          // Extrair informações de paginação
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1);
            setTotalPayments(
              response.data.pagination.total || response.data.payments.length
            );
          }
        } else if (Array.isArray(response.data)) {
          // Caso a API retorne diretamente um array
          setPayments(response.data);
          setTotalPages(1);
          setTotalPayments(response.data.length);
        } else {
          // Caso não tenha dados
          setPayments([]);
          setTotalPages(1);
          setTotalPayments(0);
        }
      } catch (apiError: any) {
        console.error("Erro ao buscar pagamentos:", apiError);

        // Se for erro 404, não tratar como erro crítico
        if (apiError?.response?.status === 404) {
          setPayments([]);
          setTotalPages(1);
          setTotalPayments(0);
        } else {
          // Para outros erros, mostrar mensagem adequada
          let errorMessage = "Erro ao carregar pagamentos.";

          if (apiError?.response?.status === 401) {
            errorMessage = "Você não está autenticado. Faça login novamente.";
          } else if (apiError?.response?.status === 403) {
            errorMessage = "Você não tem permissão para acessar esses dados.";
          } else if (apiError?.message) {
            errorMessage += ` ${apiError.message}`;
          }

          setError(errorMessage);
        }
      }
    } catch (error: any) {
      console.error("Erro geral na função fetchPayments:", error);
      setError("Erro ao carregar pagamentos. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    currentPage,
    filter,
    setLoading,
    setError,
    setPayments,
    setTotalPages,
    setTotalPayments,
  ]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const checkForOpenCashRegister = async (): Promise<boolean> => {
    try {
      // Importar dinamicamente para evitar erros de ciclo
      const { checkOpenCashRegister } = await import(
        "../../../app/services/cashRegister"
      );
      const result = await checkOpenCashRegister();
      return result.hasCashRegister;
    } catch (error) {
      console.error("Erro ao verificar caixa:", error);
      return false;
    }
  };

  const handleNewPayment = async () => {
    try {
      // Verificar se há um caixa aberto
      const hasOpenRegister = await checkForOpenCashRegister();

      if (hasOpenRegister) {
        router.push("/payments/new");
      } else {
        // Mostrar mensagem e oferecer opção de abrir caixa
        toast({
          variant: "destructive",
          title: "Nenhum caixa aberto",
          description:
            "É necessário abrir um caixa antes de registrar pagamentos.",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status do caixa:", error);
      // Permitir continuar mesmo com erro na verificação
      router.push("/payments/new");
    }
  };

  // Função para formatar data
  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return "N/A";

    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para obter a classe de tipo de pagamento
  const getPaymentTypeClass = (type: string) => {
    switch (type) {
      case "sale":
        return "text-green-600 bg-green-100 px-2 py-1 rounded";
      case "debt_payment":
        return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
      case "expense":
        return "text-red-600 bg-red-100 px-2 py-1 rounded";
      default:
        return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
    }
  };

  // Função para obter a classe de status
  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100 px-2 py-1 rounded";
      case "pending":
        return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
      case "cancelled":
        return "text-red-600 bg-red-100 px-2 py-1 rounded";
      default:
        return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
    }
  };

  // Traduzir tipo de pagamento
  const translatePaymentType = (type: string): string => {
    const typeMap: Record<string, string> = {
      sale: "Venda",
      debt_payment: "Pagamento de Débito",
      expense: "Despesa",
    };

    return typeMap[type] || type;
  };

  // Traduzir método de pagamento
  const translatePaymentMethod = (method: string): string => {
    const methodMap: Record<string, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      pix: "PIX",
    };

    return methodMap[method] || method;
  };

  // Traduzir status
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      completed: "Concluído",
      pending: "Pendente",
      cancelled: "Cancelado",
    };

    return statusMap[status] || status;
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

  // Verificar estado vazio
  const showEmptyState = !loading && !error && payments.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pagamentos</h1>
      <div className="flex justify-between">
        <Input
          placeholder="Buscar pagamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleNewPayment}>Novo Pagamento</Button>
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
          <h3 className="text-lg font-semibold">
            Não há pagamentos registrados
          </h3>
          <p className="text-muted-foreground mt-2">
            Nenhum pagamento foi registrado no sistema ainda.
          </p>
        </div>
      )}

      {!loading && !error && payments.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>
                    {payment.description || "Sem descrição"}
                  </TableCell>
                  <TableCell>
                    <div className={getPaymentTypeClass(payment.type)}>
                      {translatePaymentType(payment.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {translatePaymentMethod(payment.paymentMethod)}
                  </TableCell>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell>R$ {payment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className={getStatusClass(payment.status)}>
                      {translateStatus(payment.status)}
                    </div>
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/payments/${payment._id}`)}
                    >
                      Detalhes
                    </Button>
                    {payment.status !== "cancelled" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          // Implemente a lógica de cancelamento aqui
                          console.log("Cancelar pagamento", payment._id);
                        }}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
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
                Mostrando {payments.length} de {totalPayments} pagamentos
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
