"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/profile/UserTable";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { CustomerExportButton } from "@/components/customers/CustomerExportButton";
import { StatCard } from "@/components/ui/StatCard";
import { Loader2, UserX, Users, Crown, Calendar, DollarSign, Plus, UserCheck, UserPlus, X } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useCustomerUtils } from "@/hooks/useCustomerUtils";
import type { Column } from "@/app/_types/user";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PageContainer } from "@/components/ui/page-container";
import { 
  ListPageHeader, 
  FilterSelects, 
  ActionButtons, 
  AdvancedFilters,
  ListPageContent 
} from "@/components/ui/list-page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function CustomersPage() {
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para os filtros básicos (selects)
  const [selectedCustomerType, setSelectedCustomerType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const {
    customers,
    isLoading,
    error,
    search,
    setSearch,
    navigateToCustomerDetails,
    currentPage,
    totalPages,
    setCurrentPage,
    totalItems,
    totalCustomers, // Total real de clientes (não filtrado)
    limit,
    refetch,
    filters,
    updateFilters,
    getActiveFiltersCount
  } = useCustomers();

  const { calculateCustomerStats } = useCustomerUtils();
  
  // Calcular estatísticas dos clientes atuais (filtrados)
  const stats = calculateCustomerStats(customers);
  
  // Usar o total real de clientes para o card principal
  const realTotalCustomers = totalCustomers || 0;

  const customerColumns: Column[] = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Telefone" },
    { key: "cpf", header: "CPF" },
    {
      key: "purchases",
      header: "Total de Compras",
      render: (customer) => customer.purchases?.length || 0,
    },
    {
      key: "debts",
      header: "Débitos",
      render: (customer) => `R$ ${(customer.debts || 0).toFixed(2)}`,
    },
    {
      key: "customerCategory",
      header: "Categoria",
      render: (customer) => {
        if (customer.customerCategory === "vip") {
          return <Badge className="bg-yellow-500 text-white">VIP</Badge>;
        }
        if (customer.customerCategory === "regular") {
          return <Badge className="bg-blue-500 text-white">Regular</Badge>;
        }
        return <Badge className="bg-zinc-500 text-white">Novo</Badge>;
      },
    },
  ];

  const handleEditCustomer = (customer: any) => {
    setCustomerToEdit(customer);
    setEditCustomerDialogOpen(true);
  };

  // Atualizar filtros quando os selects básicos mudarem
  useEffect(() => {
    const newFilters: Record<string, any> = {};
    if (selectedCustomerType !== "all") {
      newFilters.customerType = selectedCustomerType;
    }
    if (selectedCategory !== "all") {
      if (selectedCategory === 'vip') {
        newFilters.purchaseRange = '5+';
      } else if (selectedCategory === 'regular') {
        newFilters.purchaseRange = '1-2'; // Pode ser adaptado para múltiplos se backend aceitar
      } else if (selectedCategory === 'novo') {
        newFilters.purchaseRange = '0';
      }
    }
    updateFilters(newFilters);
  }, [selectedCustomerType, selectedCategory, updateFilters]);

  // Função para limpar todos os filtros
  const handleClearAllFilters = useCallback(() => {
    setSelectedCustomerType("all");
    setSelectedCategory("all");
    setSearch("");
    updateFilters({ sort: "name" });
  }, [setSearch, updateFilters]);

  // Função estável para atualizar filtros
  const handleUpdateFilters = useCallback((newFilters: Record<string, any>) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const showEmptyState = !isLoading && !error && customers.length === 0;

  useEffect(() => {
    // Só limpar o estado quando o dialog for fechado
    if (!editCustomerDialogOpen) {
      setCustomerToEdit(undefined);
    }
  }, [editCustomerDialogOpen]);

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Clientes"
            value={realTotalCustomers.toLocaleString()}
            icon={Users}
            iconColor="text-blue-600 dark:text-blue-400"
            bgColor="bg-blue-100 dark:bg-blue-900"
            badge={{
              text: `+${Math.floor(realTotalCustomers * 0.1)} esta semana`,
              className: "bg-blue-500 text-white border-0"
            }}
          />

          <StatCard
            title="Clientes VIP"
            value={stats.vipCustomers}
            icon={Crown}
            iconColor="text-yellow-600 dark:text-yellow-400"
            bgColor="bg-yellow-100 dark:bg-yellow-900"
            badge={{
              text: "5+ compras",
              className: "bg-yellow-500 text-white border-0"
            }}
          />

          <StatCard
            title="Novos este Mês"
            value={stats.newThisMonth}
            icon={Calendar}
            iconColor="text-green-600 dark:text-green-400"
            bgColor="bg-green-100 dark:bg-green-900"
            badge={{
              text: "este mês",
              className: "bg-green-500 text-white border-0"
            }}
          />

          <StatCard
            title="Clientes Ativos"
            value={stats.activeCustomers}
            icon={DollarSign}
            iconColor="text-purple-600 dark:text-purple-400"
            bgColor="bg-purple-100 dark:bg-purple-900"
            badge={{
              text: "com compras",
              className: "bg-purple-500 text-white border-0"
            }}
          />
        </div>

        {/* Filtros e Busca */}
        <ListPageHeader
          title="Lista de Clientes"
          searchValue={search}
          searchPlaceholder="Buscar por nome, email ou CPF"
          onSearchChange={setSearch}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
          activeFiltersCount={getActiveFiltersCount}
        >
          <FilterSelects>
            <div className="flex flex-row items-center gap-3 w-full">
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger id="customer-category-select" className="h-10 w-[210px] max-w-md">
                  <SelectValue placeholder="Categoria de cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Todas
                    </span>
                  </SelectItem>
                  <SelectItem value="vip">
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      VIP (5+ compras)
                    </span>
                  </SelectItem>
                  <SelectItem value="regular">
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-500" />
                      Regular (1-4 compras)
                    </span>
                  </SelectItem>
                  <SelectItem value="novo">
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-gray-500" />
                      Novo (0 compras)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterSelects>

          <ActionButtons>
            <div className="flex flex-row items-center gap-2">
              <CustomerExportButton 
                filters={filters}
                buttonText="Exportar"
                variant="outline"
                disabled={isLoading || customers.length === 0}
                size="sm"
              />
              <Button 
                onClick={() => setNewCustomerDialogOpen(true)} 
                size="sm" 
                className="min-w-[140px] bg-[var(--primary-blue)] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
              {getActiveFiltersCount > 0 && (
                <Button onClick={handleClearAllFilters} variant="outline" size="sm" className="min-w-[140px]">
                  <X className="h-3.5 w-3.5 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </ActionButtons>

          <AdvancedFilters>
            <CustomerFilters 
              onUpdateFilters={handleUpdateFilters}
            />
          </AdvancedFilters>
        </ListPageHeader>

        {/* Lista de Clientes */}
        <ListPageContent>
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
              <h3 className="text-lg font-semibold">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                {search || getActiveFiltersCount > 0 
                  ? "Tente ajustar os filtros de busca." 
                  : "Clique em 'Novo Cliente' para adicionar um cliente ao sistema."
                }
              </p>
              {(!search && getActiveFiltersCount === 0) && (
                <Button onClick={() => setNewCustomerDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
              )}
              {(search || getActiveFiltersCount > 0) && (
                <Button onClick={handleClearAllFilters} variant="outline">
                  Limpar Filtros
                </Button>
              )}
            </div>
          )}

          {!isLoading && !error && customers.length > 0 && (
            <div className="overflow-hidden">
              <UserTable
                data={customers}
                columns={customerColumns}
                onDetailsClick={navigateToCustomerDetails}
                onEditClick={handleEditCustomer}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                totalItems={totalItems}
                pageSize={limit}
              />
            </div>
          )}
        </ListPageContent>

        {/* Dialog de Novo Cliente */}
        <CustomerDialog
          open={newCustomerDialogOpen}
          onOpenChange={setNewCustomerDialogOpen}
          onSuccess={() => {
            // Recarregar a lista de clientes após cadastro
            refetch();
          }}
        />

        {/* Dialog de Edição de Cliente */}
        <CustomerDialog
          open={editCustomerDialogOpen}
          onOpenChange={setEditCustomerDialogOpen}
          onSuccess={() => {
            // Recarregar a lista de clientes após edição
            refetch();
          }}
          customer={customerToEdit}
        />
      </div>
    </PageContainer>
  );
}