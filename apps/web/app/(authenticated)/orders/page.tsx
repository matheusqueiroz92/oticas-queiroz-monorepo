"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Loader2, FileX, RefreshCw, Download } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { formatCurrency, formatDate } from "@/app/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { useLaboratories } from "@/hooks/useLaboratories";
import { useEmployees } from "@/hooks/useEmployees";
import { Label } from "@/components/ui/label";
import debounce from 'lodash/debounce';

import { exportToPDF } from "@/app/utils/exportToPdf";
import { Employee } from "@/app/types/employee";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const { toast } = useToast();
  const { laboratories, isLoading: isLoadingLabs } = useLaboratories();
  const { employees, isLoading: isLoadingEmployees } = useEmployees();

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
    refreshOrdersList,
    getClientName,
    getEmployeeName,
    getLaboratoryName
  } = useOrders();

  const debouncedSearch = useMemo(
    () => debounce((value) => {
      const newFilters: any = {};
      if (value) newFilters.search = value;
      updateFilters(newFilters);
    }, 300),
    [updateFilters]
  );

  useEffect(() => {
    if (selectedEmployeeId && selectedEmployeeId !== "all") {
      console.log(`Filtro de funcionário aplicado: ${selectedEmployeeId}`);
    }
    
    if (selectedPaymentMethod && selectedPaymentMethod !== "all") {
      console.log(`Filtro de método de pagamento aplicado: ${selectedPaymentMethod}`);
    }
    
    applyFilters();
  }, [selectedStatus, selectedEmployeeId, selectedPaymentMethod, selectedLaboratoryId, dateRange]);

  useEffect(() => {
    debouncedSearch(search);
    return () => {
      debouncedSearch.cancel();
    };
  }, [search, debouncedSearch]);

  const applyFilters = () => {
    console.log('Aplicando filtros:', { 
      search, 
      status: selectedStatus,
      employeeId: selectedEmployeeId,
      paymentMethod: selectedPaymentMethod,
      laboratoryId: selectedLaboratoryId,
      dateRange 
    });
    
    const newFilters: any = {};
    
    if (search) newFilters.search = search;
    
    if (selectedStatus && selectedStatus !== "all") {
      newFilters.status = selectedStatus;
    }
    
    if (selectedEmployeeId && selectedEmployeeId !== "all") {
      newFilters.employeeId = selectedEmployeeId;
    }
    
    if (selectedPaymentMethod && selectedPaymentMethod !== "all") {
      newFilters.paymentMethod = selectedPaymentMethod;
    }
    
    if (selectedLaboratoryId && selectedLaboratoryId !== "all") {
      newFilters.laboratoryId = selectedLaboratoryId;
    }
    
    if (dateRange.startDate) {
      newFilters.startDate = dateRange.startDate;
    }
    
    if (dateRange.endDate) {
      newFilters.endDate = dateRange.endDate;
    }
    
    console.log('Enviando para updateFilters:', newFilters);
    
    updateFilters(newFilters);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedStatus, selectedEmployeeId, selectedPaymentMethod, selectedLaboratoryId, dateRange]);

  const handleClearFilters = () => {
    setSearch("");
    setDateRange({ startDate: '', endDate: '' });
    setSelectedStatus("all");
    setSelectedEmployeeId("all");
    setSelectedPaymentMethod("all");
    setSelectedLaboratoryId("all");
    updateFilters({});
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrdersList();
      toast({
        title: "Atualizado",
        description: "Lista de pedidos atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar lista:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar lista de pedidos.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportToPDF = async () => {
    setIsExporting(true);
    try {
      const exportData = orders.map(order => ({
        cliente: getClientName(order.clientId.toString()),
        data: formatDate(order.createdAt),
        status: getStatusBadge(order.status).label,
        vendedor: getEmployeeName(order.employeeId.toString()),
        laboratório: order.laboratoryId ? getLaboratoryName(order.laboratoryId.toString()) : "N/A",
        total: formatCurrency(order.finalPrice || order.totalPrice)
      }));

      await exportToPDF(exportData, 'pedidos-filtrados.pdf', 'Pedidos Filtrados');
      
      toast({
        title: "Exportação concluída",
        description: "Os pedidos foram exportados com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao exportar os pedidos.",
      });
    } finally {
      setIsExporting(false);
    }
  };

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

    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

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

    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

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

  // Verificar se não há pedidos para mostrar
  const showEmptyState = !isLoading && !error && orders.length === 0;

  // Mapear métodos de pagamento para exibição
  const paymentMethods = [
    { value: "credit", label: "Cartão de Crédito" },
    { value: "debit", label: "Cartão de Débito" },
    { value: "cash", label: "Dinheiro" },
    { value: "pix", label: "PIX" },
    { value: "installment", label: "Parcelado" }
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportToPDF}
            disabled={isExporting || isLoading || orders.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={navigateToCreateOrder}>Novo Pedido</Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Pedidos</CardTitle>
          <CardDescription>
            Visualize, filtre e gerencie todos os pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Seção de filtros */}
          <div className="bg-muted p-4 rounded-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Filtros</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters}
              >
                Limpar Filtros
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Filtro de busca */}
              <div>
                <Label htmlFor="search">Buscar cliente</Label>
                <Input
                  id="search"
                  placeholder="Nome ou CPF do cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {/* Filtro de data inicial */}
              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              {/* Filtro de data final */}
              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro de status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_production">Em Produção</SelectItem>
                    <SelectItem value="ready">Pronto</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro de vendedor */}
              <div>
                <Label htmlFor="employee">Vendedor</Label>
                <Select 
                  value={selectedEmployeeId} 
                  onValueChange={setSelectedEmployeeId}
                >
                  <SelectTrigger id="employee" className="mt-1">
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os vendedores</SelectItem>
                    {isLoadingEmployees ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : (
                      employees.map((employee: Employee) => (
                        <SelectItem key={employee._id} value={employee._id}>
                          {employee.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
          
              {/* Filtro de métodos de pagamento */}
              <div>
                <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                <Select 
                  value={selectedPaymentMethod} 
                  onValueChange={setSelectedPaymentMethod}
                >
                  <SelectTrigger id="paymentMethod" className="mt-1">
                    <SelectValue placeholder="Selecione um método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os métodos</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          
              {/* Filtro de laboratórios */}
              <div>
                <Label htmlFor="laboratory">Laboratório</Label>
                <Select 
                  value={selectedLaboratoryId} 
                  onValueChange={setSelectedLaboratoryId}
                >
                  <SelectTrigger id="laboratory" className="mt-1">
                    <SelectValue placeholder="Selecione um laboratório" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os laboratórios</SelectItem>
                    {isLoadingLabs ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : (
                      laboratories.map((lab) => (
                        <SelectItem key={lab._id} value={lab._id}>
                          {lab.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
          <FileX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Não há pedidos cadastrados</h3>
          <p className="text-muted-foreground mt-2">
            Nenhum pedido foi encontrado com os filtros aplicados.
          </p>
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Laboratório</TableHead>
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
                        {getClientName(order.clientId.toString()) === "Carregando..." ? "Carregando..." : getClientName(order.clientId.toString())}
                      </TableCell>

                      <TableCell>{formatDate(order.createdAt)}</TableCell>

                      <TableCell>
                        <Badge className={statusInfo.className}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {getEmployeeName(order.employeeId.toString()) === "Carregando..." ? "Carregando..." : getEmployeeName(order.employeeId.toString())}
                      </TableCell>
                      
                      <TableCell>
                        {order.laboratoryId 
                          ? getLaboratoryName(order.laboratoryId.toString()) 
                          : <span className="text-muted-foreground text-sm">Não atribuído</span>}
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