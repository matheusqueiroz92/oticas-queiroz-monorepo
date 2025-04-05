// apps/web/app/(authenticated)/legacy-clients/page.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, UserX, Search, CreditCard, ChevronDown, X } from "lucide-react";
import { useLegacyClients } from "@/hooks/useLegacyClients";
import { LegacyClientTable } from "@/components/LegacyClients/LegacyClientTable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PageTitle } from "@/components/PageTitle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function LegacyClientsPage() {
  const [minDebt, setMinDebt] = useState<string>("");
  const [maxDebt, setMaxDebt] = useState<string>("");
  
  const {
    legacyClients,
    isLoading,
    error,
    search,
    setSearch,
    filters,
    updateFilters,
    clearFilters,
    navigateToLegacyClientDetails,
    navigateToNewLegacyClient,
    handleToggleClientStatus,
    isTogglingStatus,
  } = useLegacyClients();

  const applyDebtFilter = () => {
    const filterParams: Record<string, any> = { ...filters };
    
    if (minDebt) {
      filterParams.minDebt = parseFloat(minDebt);
    }
    
    if (maxDebt) {
      filterParams.maxDebt = parseFloat(maxDebt);
    }
    
    updateFilters(filterParams);
  };

  const handleClearDebtFilter = () => {
    setMinDebt("");
    setMaxDebt("");
    
    // Remover apenas os filtros de dívida, mantendo outros filtros
    const { minDebt: _, maxDebt: __, ...restFilters } = filters;
    updateFilters(restFilters);
  };

  const showEmptyState = !isLoading && !error && legacyClients.length === 0;

  return (
    <div className="space-y-4 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Clientes Legados"
        description="Gerenciamento de clientes com dívidas pré-existentes"
      />

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative w-full max-w-md">
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 w-full"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs">?</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Você pode buscar por:</p>
                  <ul className="list-disc pl-4 text-xs mt-1">
                    <li>Nome do cliente</li>
                    <li>CPF do cliente (formato: 12345678900)</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex gap-2">
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => 
                updateFilters({ ...filters, status: value !== "all" ? value : undefined })
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  Filtrar por Dívida
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Valor Mínimo</span>
                      <Input
                        type="number"
                        placeholder="R$ mínimo"
                        value={minDebt}
                        onChange={(e) => setMinDebt(e.target.value)}
                        min="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Valor Máximo</span>
                      <Input
                        type="number"
                        placeholder="R$ máximo"
                        value={maxDebt}
                        onChange={(e) => setMaxDebt(e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleClearDebtFilter}
                    >
                      Limpar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={applyDebtFilter}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {(search || Object.keys(filters).length > 0) && (
              <Button 
                variant="ghost" 
                onClick={clearFilters} 
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        <Button onClick={navigateToNewLegacyClient}>Novo Cliente Legado</Button>
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
          <h3 className="text-lg font-semibold">Não há clientes legados cadastrados</h3>
          <p className="text-muted-foreground mt-2">
            {search || Object.keys(filters).length > 0
              ? "Nenhum cliente corresponde aos filtros aplicados."
              : "Clique em 'Novo Cliente Legado' para adicionar um cliente ao sistema."}
          </p>
          {(search || Object.keys(filters).length > 0) ? (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="mt-4"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          ) : (
            <Button 
              className="mt-4" 
              onClick={navigateToNewLegacyClient}
            >
              Cadastrar Cliente Legado
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && legacyClients.length > 0 && (
        <LegacyClientTable
          data={legacyClients}
          onDetailsClick={navigateToLegacyClientDetails}
          onToggleStatus={handleToggleClientStatus}
          isTogglingStatus={isTogglingStatus}
        />
      )}
    </div>
  );
}