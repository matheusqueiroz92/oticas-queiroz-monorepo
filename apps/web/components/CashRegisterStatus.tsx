"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { checkOpenCashRegister } from "../app/services/cashRegister";
import { useToast } from "@/hooks/use-toast";
import type { CashRegister } from "../app/types/cash-register";

interface CashStatusResult {
  isOpen: boolean;
  data?: CashRegister | null;
}

interface CashRegisterStatusProps {
  redirectOnNoCashRegister?: boolean;
  showOpenButton?: boolean;
  onStatusChange?: (status: CashStatusResult) => void;
  refreshInterval?: number; // Intervalo de atualização em ms (opcional)
}

/**
 * Componente para verificar e exibir o status do caixa
 * Pode ser usado em várias páginas para consistência
 */
export function CashRegisterStatus({
  redirectOnNoCashRegister = false,
  showOpenButton = true,
  onStatusChange,
  refreshInterval,
}: CashRegisterStatusProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCashRegister, setHasCashRegister] = useState(false);
  const [cashRegisterData, setCashRegisterData] = useState<CashRegister | null>(
    null
  );
  const router = useRouter();
  const { toast } = useToast();

  // Definir a verificação como uma função de callback para poder referenciar em intervalos
  const verifyCashRegister = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await checkOpenCashRegister();

      setHasCashRegister(result.hasCashRegister);
      setCashRegisterData(result.data);

      if (onStatusChange) {
        onStatusChange({
          isOpen: result.hasCashRegister,
          data: result.data,
        });
      }

      // Se não houver caixa e a opção de redirecionamento estiver ativa
      if (!result.hasCashRegister && redirectOnNoCashRegister) {
        toast({
          variant: "destructive",
          title: "Nenhum caixa aberto",
          description: "É necessário abrir um caixa para continuar.",
        });

        // Pequeno atraso para garantir que o toast seja exibido antes do redirecionamento
        setTimeout(() => {
          router.push("/cash-register");
        }, 1500);
      }
    } catch (error) {
      console.error("Erro ao verificar status do caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível verificar o status do caixa.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [router, toast, redirectOnNoCashRegister, onStatusChange]);

  // Efeito para verificar o status do caixa
  useEffect(() => {
    verifyCashRegister();

    // Se tiver intervalo de atualização, configura o timer
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(verifyCashRegister, refreshInterval);
    }

    // Limpeza do intervalo quando o componente for desmontado
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [verifyCashRegister, refreshInterval]);

  // Se estiver carregando, mostrar indicador
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Verificando status do caixa...</span>
      </div>
    );
  }

  // Se não houver caixa aberto
  if (!hasCashRegister) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md flex items-center justify-between">
        <div>
          <p className="font-medium">Nenhum caixa aberto</p>
          <p className="text-sm">
            É necessário abrir um caixa para registrar operações financeiras.
          </p>
        </div>
        {showOpenButton && (
          <Button size="sm" onClick={() => router.push("/cash-register/open")}>
            Abrir Caixa
          </Button>
        )}
      </div>
    );
  }

  // Se houver caixa aberto
  return (
    <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md flex items-center justify-between">
      <div>
        <p className="font-medium">Caixa aberto</p>
        <p className="text-sm">
          {cashRegisterData?.currentBalance !== undefined ? (
            <>Saldo atual: R$ {cashRegisterData.currentBalance.toFixed(2)}</>
          ) : (
            <>Caixa aberto e disponível</>
          )}
        </p>
      </div>
      {cashRegisterData?._id && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (cashRegisterData._id) {
              router.push(`/cash-register/${cashRegisterData._id}`);
            }
          }}
        >
          Ver Detalhes
        </Button>
      )}
    </div>
  );
}
