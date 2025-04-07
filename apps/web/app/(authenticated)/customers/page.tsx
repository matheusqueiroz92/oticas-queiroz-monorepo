"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/Users/UserTable";
import { Loader2, UserX, Search, X, RefreshCw } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import type { Column } from "@/app/types/user";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PageTitle } from "@/components/PageTitle";
import { PaginationItems } from "@/components/PaginationItems";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CustomersPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  const {
    customers,
    isLoading,
    error,
    search,
    setSearch,
    currentPage,
    totalPages,
    totalUsers,
    setCurrentPage,
    navigateToCustomerDetails,
    navigateToNewCustomer,
    refreshUsersList
  } = useUsers({ role: 'customer' });

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

  const handleClearSearch = () => {
    setSearch("");
  };
  
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUsersList();
      toast({
        title: "Atualizado",
        description: "Lista de clientes atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar lista:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar lista de clientes.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Clientes"
        description="Lista de clientes da loja"
      />
      
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <Input
            placeholder="Buscar por nome ou CPF"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 w-full"
            size={50}
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          
          {search && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
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
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            size="sm"
            className="h-10"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button onClick={navigateToNewCustomer}>Novo Cliente</Button>
        </div>
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
        <>
          <UserTable
            data={customers}
            columns={customerColumns}
            onDetailsClick={navigateToCustomerDetails}
          />
        
          <PaginationItems
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalItems={totalUsers}
            pageSize={customers.length}
          />
        </>
      )}
    </div>
  );
}