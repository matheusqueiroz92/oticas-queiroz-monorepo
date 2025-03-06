"use client";

import { useEffect, useState } from "react";
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
import { Loader2, FileX } from "lucide-react";
import { api } from "../../services/auth";
import type { Order } from "../../types/order";
import axios from "axios";

type OrderStatus = "pending" | "in_production" | "ready" | "delivered";

// Função auxiliar para extrair nomes de strings de objetos MongoDB
const extractName = (objectString: string) => {
  try {
    // Usa regex para extrair o nome entre aspas simples após 'name:'
    const nameMatch = objectString.match(/name: ['"]([^'"]+)['"]/);
    if (nameMatch?.[1]) {
      return nameMatch[1];
    }
    return "Nome não disponível";
  } catch (error) {
    console.error("Erro ao extrair nome:", error);
    return "Nome não disponível";
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Enviar a página atual para a API
        const response = await api.get("/api/orders", {
          params: {
            search,
            page: currentPage,
            // Adicionando ordenação para sempre mostrar mais recentes primeiro
            sort: "-createdAt",
          },
        });

        // Verificar se a resposta tem a estrutura esperada
        if (response.data?.orders) {
          setOrders(response.data.orders);

          // Extrair informações de paginação
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1);
            setTotalOrders(
              response.data.pagination.total || response.data.orders.length
            );
          }
        } else if (Array.isArray(response.data)) {
          // Caso a API retorne diretamente um array
          setOrders(response.data);
          setTotalPages(1);
          setTotalOrders(response.data.length);
        } else {
          // Caso não tenha dados estruturados
          setOrders([]);
          setTotalPages(1);
          setTotalOrders(0);
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);

        // Verificar se é um erro 404 (não encontrado)
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // Este não é um erro real, apenas significa que não há pedidos
          setOrders([]);
          setTotalPages(1);
          setTotalOrders(0);
          setError(null); // Importante: limpar qualquer erro anterior
        } else {
          // Para outros erros, mostrar mensagem de erro
          setError("Erro ao carregar pedidos. Tente novamente mais tarde.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [search, currentPage]);

  // Função para determinar a classe de status
  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100 px-2 py-1 rounded";
      case "in_production":
        return "text-blue-600 bg-blue-100 px-2 py-1 rounded";
      case "ready":
        return "text-green-600 bg-green-100 px-2 py-1 rounded";
      case "delivered":
        return "text-purple-600 bg-purple-100 px-2 py-1 rounded";
      default:
        return "text-gray-600 bg-gray-100 px-2 py-1 rounded";
    }
  };

  // Tradução de status
  const translateStatus = (status: string): string => {
    const statusMap: Record<OrderStatus, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
    };

    return statusMap[status as OrderStatus] || status;
  };

  // Função para formatar data
  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return "N/A";

    // Converter para Date se for string, ou usar diretamente se já for Date
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para gerar itens de paginação
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Se tivermos menos páginas que o máximo visível, mostrar todas
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

  const showEmptyState = !loading && !error && orders.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <div className="flex justify-between">
        <Input
          placeholder="Buscar pedido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => router.push("/orders/new")}>Novo Pedido</Button>
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
          <FileX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Não há pedidos cadastrados</h3>
          <p className="text-muted-foreground mt-2">
            Nenhum pedido foi cadastrado no sistema ainda.
          </p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>
                    {typeof order.clientId === "string"
                      ? extractName(order.clientId)
                      : "Cliente não identificado"}
                  </TableCell>
                  <TableCell>
                    {typeof order.employeeId === "string"
                      ? extractName(order.employeeId)
                      : "Funcionário não identificado"}
                  </TableCell>
                  <TableCell>
                    <span className={getStatusClass(order.status)}>
                      {translateStatus(order.status)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    R$ {Number(order.totalPrice).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/orders/${order._id}`)}
                    >
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação usando o Shadcn UI */}
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
                Mostrando {orders.length} de {totalOrders} pedidos
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
