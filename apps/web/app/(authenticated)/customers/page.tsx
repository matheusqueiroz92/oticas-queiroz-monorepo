"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/Users/UserTable";
import { Loader2, UserX } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import type { Column } from "@/app/types/user";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function CustomersPage() {
  const {
    customers,
    isLoading,
    error,
    search,
    setSearch,
    navigateToCustomerDetails,
    navigateToNewCustomer,
  } = useCustomers();

  const customerColumns: Column[] = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    {
      key: "purchases",
      header: "Total de Compras",
      render: (customer) => customer.purchases?.length || 0,
    },
    {
      key: "debts",
      header: "Débitos",
      render: (customer) => customer.debts?.toFixed(2) || "0.00",
    },
  ];

  const showEmptyState = !isLoading && !error && customers.length === 0;

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <h1 className="text-2xl font-bold text-primary">Clientes</h1>
      <div className="flex justify-between">
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={navigateToNewCustomer}>Novo Cliente</Button>
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
          <h3 className="text-lg font-semibold">Não há clientes cadastrados</h3>
          <p className="text-muted-foreground mt-2">
            Clique em "Novo Cliente" para adicionar um cliente ao sistema.
          </p>
        </div>
      )}

      {!isLoading && !error && customers.length > 0 && (
        <UserTable
          data={customers}
          columns={customerColumns}
          onDetailsClick={navigateToCustomerDetails}
        />
      )}
    </div>
  );
}
