"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationItems } from "@/components/PaginationItems";
import { EmployeeDialog } from "@/components/employees/EmployeeDialog";
import { Loader2, UserX, Search, Users, Crown, TrendingUp, DollarSign, Plus, Filter, Download, Eye, Edit } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import type { Column } from "@/app/_types/user";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PageContainer } from "@/components/ui/page-container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EmployeesPage() {
  const [newEmployeeDialogOpen, setNewEmployeeDialogOpen] = useState(false);
  const [editEmployeeDialogOpen, setEditEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  const {
    employees,
    isLoading,
    error,
    search,
    setSearch,
    navigateToEmployeeDetails,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    limit,
    refetch,
  } = useEmployees();

  // Total de funcionários
  const totalEmployees = employees.length;
  
  // Funcionário com mais vendas (simulado)
  const topEmployee = employees.reduce((top, employee) => {
    const employeeSales = employee.sales?.length || 0;
    const topSales = top?.sales?.length || 0;
    return employeeSales > topSales ? employee : top;
  }, employees[0]);
  
  // Total de vendas/pedidos no mês (simulado)
  const totalSalesThisMonth = employees.reduce((total, employee) => {
    return total + (employee.sales?.length || 0);
  }, 0);
  
  // Total em reais de vendas/pedidos no mês (simulado)
  const totalRevenueThisMonth = employees.reduce((total, employee) => {
    // Simular um valor médio por venda
    const employeeSales = employee.sales?.length || 0;
    return total + (employeeSales * 450); // R$ 450 por venda em média
  }, 0);

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setEditEmployeeDialogOpen(true);
  };

  const employeeColumns: Column[] = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Função",
      render: (employee) => employee.role === "admin" ? "Administrador" : "Funcionário",
    },
    {
      key: "sales",
      header: "Total de Vendas",
      render: (employee) => employee.sales?.length || 0,
    },
    {
      key: "totalSales",
      header: "Valor Total",
      render: (employee) => {
        const salesCount = employee.sales?.length || 0;
        const totalValue = salesCount * 450; // Valor médio simulado
        return `R$ ${totalValue.toFixed(2)}`;
      },
    },
    {
      key: "actions",
      header: "Ações",
      render: (employee) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToEmployeeDetails(employee._id)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Detalhes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditEmployee(employee)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      ),
    },
  ];

  const showEmptyState = !isLoading && !error && employees.length === 0;

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Funcionários
              </CardTitle>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees.toLocaleString()}</div>
              <Badge variant="secondary" className="bg-blue-500 text-white border-0 text-xs mt-1">
                +{Math.floor(totalEmployees * 0.1)} este mês
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top Vendedor
              </CardTitle>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {topEmployee?.name || "N/A"}
              </div>
              <Badge variant="secondary" className="bg-yellow-500 text-white border-0 text-xs mt-1">
                {topEmployee?.sales?.length || 0} vendas
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas este Mês
              </CardTitle>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSalesThisMonth}</div>
              <Badge variant="secondary" className="bg-green-500 text-white border-0 text-xs mt-1">
                pedidos
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Mensal
              </CardTitle>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalRevenueThisMonth.toLocaleString()}</div>
              <Badge variant="secondary" className="bg-purple-500 text-white border-0 text-xs mt-1">
                este mês
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardHeader className="bg-gray-100 dark:bg-slate-800/50">
            <CardTitle className="text-lg">Lista de Funcionários</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:items-center">
              {/* Área esquerda: Input de busca e selects */}
              <div className="flex flex-1 flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Buscar por nome, email ou CPF"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="todos">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Todas as funções" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as funções</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="employee">Funcionário</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select defaultValue="todos-status">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos-status">Todos os status</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Área direita: Botões de ação */}
              <div className="flex gap-2 justify-end sm:ml-auto">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={() => setNewEmployeeDialogOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Funcionário
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}

            {error && (
              <div className="p-6">
                <ErrorAlert message={error} />
              </div>
            )}

            {showEmptyState && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserX className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Nenhum funcionário encontrado</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  {search ? "Tente ajustar os filtros de busca." : "Clique em 'Novo Funcionário' para adicionar um funcionário ao sistema."}
                </p>
                {!search && (
                  <Button onClick={() => setNewEmployeeDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Funcionário
                  </Button>
                )}
              </div>
            )}

            {!isLoading && !error && employees.length > 0 && (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-100 dark:bg-slate-800/50">
                    <TableRow>
                      {employeeColumns.map((column) => (
                        <TableHead key={column.key}>{column.header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee._id}>
                        {employeeColumns.map((column) => (
                          <TableCell key={column.key}>
                            {column.render
                              ? column.render(employee)
                              : String(employee[column.key as keyof typeof employee] || "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="bg-gray-100 dark:bg-slate-800/50 w-full p-1">
                  {(totalItems ?? 0) > 10 && (
                    <PaginationItems
                      currentPage={currentPage}
                      totalPages={totalPages}
                      setCurrentPage={setCurrentPage}
                      totalItems={totalItems}
                      pageSize={limit}
                    />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Novo Funcionário */}
        <EmployeeDialog
          open={newEmployeeDialogOpen}
          onOpenChange={setNewEmployeeDialogOpen}
          onSuccess={() => {
            // Recarregar a lista de funcionários após cadastro
            refetch();
          }}
        />

        {/* Dialog de Edição de Funcionário */}
        <EmployeeDialog
          open={editEmployeeDialogOpen}
          onOpenChange={setEditEmployeeDialogOpen}
          employee={selectedEmployee}
          mode="edit"
          onSuccess={() => {
            // Recarregar a lista de funcionários após edição
            refetch();
            setSelectedEmployee(null);
          }}
        />
      </div>
    </PageContainer>
  );
}