"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserTable } from "@/components/profile/UserTable";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { Loader2, UserX, Search, Users, Crown, Calendar, DollarSign, Plus, Filter, Download } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
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

export default function CustomersPage() {
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
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
    limit,
    refetch,
  } = useCustomers();

  // Total de clientes
  const totalCustomers = customers.length;
  
  // Clientes VIP com mais de 5 compras
  const vipCustomers = customers.filter(customer => (customer.purchases?.length || 0) >= 5).length;
  
  // Alterar aqui para mostrar os clientes novos este mês, pois está sendo simulado
  const newThisMonth = customers.filter(customer => {
    return Math.random() > 0.7; // 30% dos clientes são "novos"
  }).length;
  
  // Clientes ativos com compras
  const activeCustomers = customers.filter(customer => (customer.purchases?.length || 0) > 0).length;

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
  ];

  const showEmptyState = !isLoading && !error && customers.length === 0;

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Clientes
              </CardTitle>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
              <Badge variant="secondary" className="bg-blue-500 text-white border-0 text-xs mt-1">
                +{Math.floor(totalCustomers * 0.1)} este mês
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes VIP
              </CardTitle>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vipCustomers}</div>
              <Badge variant="secondary" className="bg-yellow-500 text-white border-0 text-xs mt-1">
                5+ compras
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Novos este Mês
              </CardTitle>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newThisMonth}</div>
              <Badge variant="secondary" className="bg-green-500 text-white border-0 text-xs mt-1">
                este mês
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Ativos
              </CardTitle>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCustomers}</div>
              <Badge variant="secondary" className="bg-purple-500 text-white border-0 text-xs mt-1">
                com compras
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <ListPageHeader
          title="Lista de Clientes"
          searchValue={search}
          searchPlaceholder="Buscar por nome, email ou CPF"
          onSearchChange={setSearch}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
          activeFiltersCount={0}
        >
          <FilterSelects>
            <Select defaultValue="todos">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
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
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </FilterSelects>

          <ActionButtons>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setNewCustomerDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </ActionButtons>

          <AdvancedFilters>
            <div></div>
          </AdvancedFilters>
        </ListPageHeader>

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
                {search ? "Tente ajustar os filtros de busca." : "Clique em 'Novo Cliente' para adicionar um cliente ao sistema."}
              </p>
              {!search && (
                <Button onClick={() => setNewCustomerDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
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
      </div>
    </PageContainer>
  );
}