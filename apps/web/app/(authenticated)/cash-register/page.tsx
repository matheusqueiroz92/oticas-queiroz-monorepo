"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { useCashRegister } from "../../../hooks/useCashRegister";
import { PageTitle } from "@/components/PageTitle";
import { useUsers } from "@/hooks/useUsers";
import { ActiveCashRegisterCard } from "@/components/CashRegister/ActiveCashRegisterCard";
import { CashRegisterFilters } from "@/components/CashRegister/CashRegisterFilters";
import { CashRegisterList } from "@/components/CashRegister/CashRegisterList";
import { CashRegisterEmptyState } from "@/components/CashRegister/CashRegisterEmptyState";

export default function CashRegisterPage() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const {
    cashRegisters,
    activeRegister,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalRegisters,
    setCurrentPage,
    updateFilters,
    navigateToOpenRegister,
    navigateToRegisterDetails,
    navigateToCloseRegister,
  } = useCashRegister();

  const {
    getAllUsers,
    usersMap,
  } = useUsers();

  useEffect(() => {
    const loadAllUsers = async () => {
      await getAllUsers();
    };
    
    loadAllUsers();
  }, [getAllUsers]);

  useEffect(() => {
    if (cashRegisters.length > 0 && !isLoading) {
      const userIds = cashRegisters
        .map(register => register.openedBy)
        .filter((id, index, self) => id && self.indexOf(id) === index);
      
      if (userIds.length > 0) {
        getAllUsers();
      }
    }
  }, [cashRegisters, isLoading, getAllUsers]);
 
  const applyDateFilter = () => {
        if (date) {
          updateFilters({
            startDate: format(date, "yyyy-MM-dd"),
            endDate: format(date, "yyyy-MM-dd"),
          });
        }
      };

  const clearFilters = () => {
    updateFilters({});
    setDate(undefined);
    setSearch("");
  };

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
