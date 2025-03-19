"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Loader2, FileX, FilterIcon } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { api } from "@/app/services/authService";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import { usePathname } from "next/navigation";

export default function OrdersPage() {
  const pathname = usePathname();
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Mapas de IDs para nomes
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  const {
    orders,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalOrders,
    setCurrentPage,
    updateFilters,
    navigateToOrderDetails,
    navigateToCreateOrder,
    refetch,
    invalidateOrdersCache
  } = useOrders();

  // Buscar TODOS os usuários para criar um mapa de IDs para nomes
  const { data: allUsersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: QUERY_KEYS.USERS.ALL,
    queryFn: async () => {
      const response = await api.get("/api/users");
      return Array.isArray(response.data) ? response.data : response.data.users || [];
    },
  });

  // Função para obter nome de usuário por ID (cliente ou vendedor)
  const getUserNameById = (userId: string): string => {
    return usersMap[userId] || userId;
  };

  // Função para obter o badge de status
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Pendente",
        className: "bg-yellow-100 text-yellow-800",
      },
      in_production: {
        label: "Em Produção",
        className: "bg-blue-100 text-blue-800",
      },
      ready: { 
        label: "Pronto", 
        className: "bg-green-100 text-green-800" 
      },
      delivered: {
        label: "Entregue",
        className: "bg-purple-100 text-purple-800",
      },
      cancelled: {
        label: "Cancelado",
        className: "bg-red-100 text-red-800",
      },
    };

    return statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    const filters: any = { search };
    
    if (statusFilter) {
      filters.status = statusFilter;
    }
    
    if (dateRange.startDate) {
      filters.startDate = dateRange.startDate;
    }
    
    if (dateRange.endDate) {
      filters.endDate = dateRange.endDate;
    }
    
    updateFilters(filters);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDateRange({ startDate: '', endDate: '' });
    updateFilters({});
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
    if (totalPages > 1) {
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
    }

    return items;
  };

  const showEmptyState = !isLoading && !error && orders.length === 0;

  // Criar mapa de IDs para nomes quando os dados de usuários forem carregados
  useEffect(() => {
    if (allUsersData) {
      const map: Record<string, string> = {};
      allUsersData.forEach((user: any) => {
        if (user._id && user.name) {
          map[user._id] = user.name;
        }
      });
      setUsersMap(map);
    }
  }, [allUsersData]);
  
  // Configurar um intervalo para revalidar os dados periodicamente
  useEffect(() => {
    // Revalidar a lista de pedidos a cada 30 segundos
    const intervalId = setInterval(() => {
      refetch();
    }, 10000);

    // Adicionar um evento de foco para revalidar quando o usuário retorna à página
    const handleFocus = () => {
      refetch();
    };
    window.addEventListener('focus', handleFocus);

    // Limpar intervalo e event listener quando o componente for desmontado
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetch]);

  // Efeito para detectar quando a página é remontada/visitada novamente
  useEffect(() => {
    // Se estivermos na página de listagem de pedidos
    if (pathname === '/orders' && shouldRefresh) {
      // Forçar atualização
      refetch();
      setShouldRefresh(false);
    }
  }, [pathname, shouldRefresh, refetch]);

  // Efeito para monitorar quando a página ganha foco (ex: volta de outra aba)
  useEffect(() => {
    const handleFocus = () => {
      if (pathname === '/orders') {
        setShouldRefresh(true);
      }
    };
    
    // Adicionar event listener para quando a janela ganha foco
    window.addEventListener('focus', handleFocus);
    
    // Adicionar event listener para navegação no Next.js
    const handleRouteChange = () => {
      if (pathname === '/orders') {
        setShouldRefresh(true);
      }
    };
    
    // Escutar evento personalizado que pode ser disparado quando voltamos à página
    document.addEventListener('order-updated', handleRouteChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('order-updated', handleRouteChange);
    };
  }, [pathname]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Button onClick={navigateToCreateOrder}>Novo Pedido</Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gerenciar Pedidos</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
          <CardDescription>
            Visualize, filtre e gerencie todos os pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              />
            </div>
            <Button variant="secondary" onClick={handleApplyFilters}>
              Buscar
            </Button>
          </div>

          {showFilters && (
            <div className="bg-muted p-4 rounded-md mb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_production">Em Produção</SelectItem>
                      <SelectItem value="ready">Pronto</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Data Inicial</label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Data Final</label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
                <Button size="sm" onClick={handleApplyFilters}>
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          )}

          {(isLoading || isLoadingUsers) && (
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
                Nenhum pedido foi encontrado com os filtros aplicados.
              </p>
            </div>
          )}

          {!isLoading && !isLoadingUsers && !error && orders.length > 0 && (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const statusInfo = getStatusBadge(order.status);
                      
                      return (
                        <TableRow key={order._id}>
                          <TableCell>
                            {getUserNameById(order.clientId)}
                          </TableCell>

                          <TableCell>{formatDate(order.createdAt)}</TableCell>

                          <TableCell>
                            <Badge className={statusInfo.className}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {getUserNameById(order.employeeId)}
                          </TableCell>

                          <TableCell className="text-right">
                            {formatCurrency(order.finalPrice || order.totalPrice)}
                          </TableCell>

                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigateToOrderDetails(order._id)}
                            >
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

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
                    Mostrando {orders.length} de {totalOrders} pedidos
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}