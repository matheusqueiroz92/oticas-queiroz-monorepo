"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2, AlertCircle, Eye } from "lucide-react";
import { checkOpenCashRegister } from "@/app/_services/cashRegisterService";
import { formatCurrency } from "@/app/_utils/formatters";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import type { ICashRegister } from "@/app/_types/cash-register";
import { useEffect } from "react";
import { useAuth } from "@/contexts/authContext";

interface CashRegisterStatusProps {
  showOpenButton?: boolean;
  showDetailsButton?: boolean;
  onStatusChange?: (status: {
    isOpen: boolean;
    data: ICashRegister | null;
  }) => void;
}

export function CashRegisterStatus({
  showOpenButton = false,
  showDetailsButton = false,
  onStatusChange,
}: CashRegisterStatusProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Verificar se o usuário tem permissão para gerenciar caixa
  const hasPermission = user?.role === "admin" || user?.role === "employee";

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
    queryFn: checkOpenCashRegister,
    refetchOnWindowFocus: false, // Desabilitado para evitar múltiplas chamadas
  });

  useEffect(() => {
    if (onStatusChange && data) {
      onStatusChange({
        isOpen: data.isOpen,
        data: data.data,
      });
    }
  }, [data, onStatusChange]);

  if (isLoading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
            <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Verificando status do caixa...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mr-3">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            {error instanceof Error
              ? error.message
              : "Erro ao verificar status do caixa"}
          </span>
        </div>
      </div>
    );
  }

  if (!data?.isOpen || !data?.data) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
              <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-medium text-red-700 dark:text-red-300 text-sm">Nenhum caixa aberto</p>
              <p className="text-xs text-red-600 dark:text-red-400">
                É necessário abrir um caixa para registrar operações.
              </p>
            </div>
          </div>
          {showOpenButton && hasPermission && (
            <Button 
              size="sm"
              onClick={() => router.push("/cash-register/open")}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Abrir Caixa
            </Button>
          )}
        </div>
      </div>
    );
  }

  const cashRegister = data.data;

  return (
    <div className="w-full md:w-1/4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-green-700 dark:text-green-300 text-sm">Caixa Aberto</p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Saldo atual: {formatCurrency(cashRegister.currentBalance)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Botão de visualizar caixa */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/cash-register/${cashRegister._id}`)}
            className="border-green-300 text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900 dark:hover:text-white"          >
            <Eye className="h-4 w-4" />
          </Button>
          {showDetailsButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/cash-register/${cashRegister._id}`)}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Ver Detalhes
            </Button>
          )}
          {cashRegister.status === "open" && hasPermission && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                router.push(`/cash-register/close/${cashRegister._id}`)
              }
              className="border-green-300 text-green-600 hover:bg-green-100 hover:text-green-900 dark:text-green-300  dark:hover:bg-green-900 dark:hover:text-white"
            >
              Fechar Caixa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
