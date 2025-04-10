"use client";

import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { useCashRegister } from "@/hooks/useCashRegister";
import { PageTitle } from "@/components/PageTitle";
import { ActiveCashRegisterCard } from "@/components/CashRegister/ActiveCashRegisterCard";
import { CashRegisterFilters } from "@/components/CashRegister/CashRegisterFilters";
import { CashRegisterList } from "@/components/CashRegister/CashRegisterList";
import { CashRegisterEmptyState } from "@/components/CashRegister/CashRegisterEmptyState";

export default function CashRegisterPage() {
  const {
    cashRegisters,
    activeRegister,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalRegisters,
    search,
    date,
    setSearch,
    setDate,
    setCurrentPage,
    applyDateFilter,
    clearFilters,
    navigateToOpenRegister,
    navigateToRegisterDetails,
    navigateToCloseRegister,
  } = useCashRegister().useCashRegisterList();

  const showEmptyState = !isLoading && !error && cashRegisters.length === 0;

  return (
    <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
      <PageTitle
        title="Controle de caixa"
        description="Gerencie e visualize os registros de caixa da loja"
      />

      {activeRegister && (
        <ActiveCashRegisterCard 
          register={activeRegister}
          onViewDetails={navigateToRegisterDetails}
          onCloseCashRegister={navigateToCloseRegister}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <CashRegisterFilters
          search={search}
          setSearch={setSearch}
          date={date}
          setDate={setDate}
          onApplyDateFilter={applyDateFilter}
          onClearFilters={clearFilters}
        />

        {!activeRegister && (
          <Button onClick={navigateToOpenRegister}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Abrir Caixa
          </Button>
        )}
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
        <CashRegisterEmptyState 
          activeRegister={!!activeRegister}
          onOpenRegister={navigateToOpenRegister}
        />
      )}

      {!isLoading && !error && cashRegisters.length > 0 && (
        <CashRegisterList
          cashRegisters={cashRegisters}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRegisters={totalRegisters}
          onDetailsClick={navigateToRegisterDetails}
          onCloseClick={navigateToCloseRegister}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
}