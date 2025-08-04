"use client";

import { useMemo } from "react";
import { LegacyClient } from "@/app/_types/legacy-client";

interface LegacyClientStats {
  totalDebt: number;
  currentDebt: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: Date;
  totalPayments: number;
  averagePayment: number;
  daysSinceLastPayment?: number;
  status: "active" | "inactive";
  createdAt?: Date;
}

export function useLegacyClientDetailsStats(
  client: LegacyClient | null,
  paymentHistory: any[] = []
): LegacyClientStats {
  return useMemo(() => {
    if (!client) {
      return {
        totalDebt: 0,
        currentDebt: 0,
        totalPayments: 0,
        averagePayment: 0,
        status: "inactive",
      };
    }

    // Calcular estatísticas dos pagamentos
    const totalPayments = paymentHistory.length;
    const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    const averagePayment = totalPayments > 0 ? totalPaid / totalPayments : 0;

    // Último pagamento
    const lastPayment = paymentHistory.length > 0 
      ? paymentHistory[0] // Assumindo que está ordenado por data decrescente
      : null;

    // Dias desde o último pagamento
    let daysSinceLastPayment: number | undefined;
    if (lastPayment?.date) {
      const lastPaymentDate = new Date(lastPayment.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastPaymentDate.getTime());
      daysSinceLastPayment = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      totalDebt: client.totalDebt || 0,
      currentDebt: client.debt || 0,
      lastPaymentAmount: lastPayment?.amount,
      lastPaymentDate: lastPayment?.date ? new Date(lastPayment.date) : undefined,
      totalPayments,
      averagePayment,
      daysSinceLastPayment,
      status: client.status,
      createdAt: client.createdAt ? new Date(client.createdAt) : undefined,
    };
  }, [client, paymentHistory]);
} 