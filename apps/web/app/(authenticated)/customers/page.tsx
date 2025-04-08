"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/Users/UserTable";
import { Loader2, UserX, Search } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import type { Column } from "@/app/types/user";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PageTitle } from "@/components/PageTitle";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CustomersPage() {
  const {
    customers,
    isLoading,
    error,
    search,
    setSearch,
    navigateToCustomerDetails,
    navigateToNewCustomer,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    limit,
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
      <PageTitle
        title="Clientes"
        description="Lista de clientes da loja"
      />
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <Input
            placeholder="Buscar por nome, CPF ou O.S."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 w-full"
            size={50}
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs">?</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Você pode buscar por:</p>
                <ul className="list-disc pl-4 text-xs mt-1">
                  <li>Nome do cliente</li>
                  <li>CPF (formato: 12345678900)</li>
                  <li>Número da O.S. (4 a 7 dígitos)</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button onClick={navigateToNewCustomer} className="ml-4">Novo Cliente</Button>
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
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          pageSize={limit}
        />
      )}
    </div>
  );
}