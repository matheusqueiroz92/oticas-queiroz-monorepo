"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/Users/UserTable";
import { Loader2, UserX } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import type { Column } from "@/app/types/user";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function EmployeesPage() {
  const {
    employees,
    isLoading,
    error,
    search,
    setSearch,
    navigateToEmployeeDetails,
    navigateToNewEmployee,
  } = useEmployees();

  // Define as colunas para a lista de funcionários
  const employeeColumns: Column[] = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    {
      key: "sales",
      header: "Total de Vendas",
      render: (employee) => employee.sales?.length || 0,
    },
    {
      key: "totalSales",
      header: "Valor Total",
      render: (employee) =>
        employee.sales?.reduce((total, _sale) => total, 0).toFixed(2),
    },
  ];

  const showEmptyState = !isLoading && !error && employees.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Funcionários</h1>
      <div className="flex justify-between">
        <Input
          placeholder="Buscar funcionário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={navigateToNewEmployee}>Novo Funcionário</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {showEmptyState && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background">
          <UserX className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">
            Não há funcionários cadastrados
          </h3>
          <p className="text-muted-foreground mt-2">
            Clique em "Novo Funcionário" para adicionar um funcionário ao
            sistema.
          </p>
        </div>
      )}

      {!isLoading && !error && employees.length > 0 && (
        <UserTable
          data={employees}
          columns={employeeColumns}
          onDetailsClick={navigateToEmployeeDetails}
        />
      )}
    </div>
  );
}
