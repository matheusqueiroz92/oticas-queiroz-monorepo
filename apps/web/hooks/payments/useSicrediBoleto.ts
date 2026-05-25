"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import {
  emitBoletoForOrder,
  checkBoletoStatus,
  cancelBoleto,
  downloadBoletoPdf,
} from "@/app/_services/sicrediService";
import { checkOpenCashRegister } from "@/app/_services/cashRegisterService";
import type { SicrediCustomerData } from "@/app/_types/sicredi";
import { useToast } from "@/hooks/useToast";
import axios from "axios";

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro desconhecido";
}

export function useSicrediBoleto(orderId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resolveCashRegisterId = async (): Promise<string | undefined> => {
    const cached = queryClient.getQueryData<{ isOpen: boolean; data?: { _id?: string } }>(
      QUERY_KEYS.CASH_REGISTERS.CURRENT
    );

    if (cached?.isOpen && cached.data?._id) {
      return cached.data._id;
    }

    const fresh = await queryClient.fetchQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      queryFn: checkOpenCashRegister,
    });

    if (fresh.isOpen && fresh.data?._id) {
      return fresh.data._id;
    }

    if (fresh.error) {
      throw new Error(fresh.error);
    }

    return undefined;
  };

  const emitMutation = useMutation({
    mutationFn: async ({
      customerData,
      dataVencimento,
    }: {
      customerData: SicrediCustomerData;
      dataVencimento?: string;
    }) => {
      if (!orderId) {
        throw new Error("ID do pedido não informado");
      }

      const cashRegisterId = await resolveCashRegisterId();

      return emitBoletoForOrder(orderId, customerData, {
        dataVencimento,
        cashRegisterId,
      });
    },
    onSuccess: (data) => {
      const count = data.boletos?.length ?? 1;
      toast({
        title: data.alreadyIssued ? "Boletos já emitidos" : "Boletos emitidos",
        description: data.alreadyIssued
          ? data.message
          : count > 1
            ? `${count} boletos gerados com sucesso`
            : data.message,
      });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId) });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENTS.ALL });
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao emitir boleto",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const checkStatusMutation = useMutation({
    mutationFn: (paymentId: string) => checkBoletoStatus(paymentId),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Status atualizado",
          description: `Situação: ${data.data?.status || "consultado"}`,
        });
        if (orderId) {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId) });
        }
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENTS.ALL });
      } else {
        toast({
          title: "Erro ao consultar status",
          description: data.error || "Tente novamente",
          variant: "destructive",
        });
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({
      paymentId,
      motivo,
    }: {
      paymentId: string;
      motivo: string;
    }) => cancelBoleto(paymentId, motivo),
    onSuccess: () => {
      toast({ title: "Boleto cancelado com sucesso" });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId) });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENTS.ALL });
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao cancelar boleto",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const downloadPdf = async (paymentId: string, nossoNumero?: string) => {
    try {
      const blob = await downloadBoletoPdf(paymentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `boleto-${nossoNumero || paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erro ao baixar PDF",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return {
    emitBoleto: emitMutation.mutateAsync,
    isEmitting: emitMutation.isPending,
    emitResult: emitMutation.data,
    checkStatus: checkStatusMutation.mutateAsync,
    isCheckingStatus: checkStatusMutation.isPending,
    cancelBoleto: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    downloadPdf,
  };
}
