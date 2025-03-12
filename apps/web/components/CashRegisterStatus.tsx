"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Loader2, AlertCircle } from "lucide-react";
import { checkOpenCashRegister } from "@/app/services/cashRegister";
import { formatCurrency } from "@/app/utils/formatters";
import type { ICashRegister } from "@/app/types/cash-register";

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
  const [isLoading, setIsLoading] = useState(true);
  const [cashRegister, setCashRegister] = useState<ICashRegister | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCashRegisterStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await checkOpenCashRegister();

        setCashRegister(result.data);

        // Notificar o componente pai sobre a mudança de status
        if (onStatusChange) {
          onStatusChange({
            isOpen: result.isOpen,
            data: result.data,
          });
        }
      } catch (error) {
        console.error("Erro ao verificar status do caixa:", error);
        setError("Não foi possível verificar o status do caixa.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCashRegisterStatus();
  }, [onStatusChange]);

  if (isLoading) {
    return (
      <Card className="mb-4 p-3">
        <CardContent className="p-2 flex items-center">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span>Verificando status do caixa...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 bg-yellow-50 border-yellow-200">
        <CardContent className="p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-700">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!cashRegister) {
    return (
      <Card className="mb-4 bg-red-50 border-red-200">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="font-medium text-red-700">Nenhum caixa aberto</p>
              <p className="text-sm text-red-600">
                É necessário abrir um caixa para registrar operações.
              </p>
            </div>
          </div>
          {showOpenButton && (
            <Button onClick={() => router.push("/cash-register/open")}>
              Abrir Caixa
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 bg-green-50 border-green-200">
      <CardContent className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <DollarSign className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <p className="font-medium text-green-700">Caixa Aberto</p>
            <p className="text-sm text-green-600">
              Saldo atual: {formatCurrency(cashRegister.currentBalance)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {showDetailsButton && (
            <Button
              variant="outline"
              onClick={() => router.push(`/cash-register/${cashRegister._id}`)}
            >
              Ver Detalhes
            </Button>
          )}
          {cashRegister.status === "open" && (
            <Button
              onClick={() =>
                router.push(`/cash-register/close/${cashRegister._id}`)
              }
            >
              Fechar Caixa
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
