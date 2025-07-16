import { useMemo } from 'react';
import type { IPayment } from '@/app/_types/payment';

interface UsePaymentsStatsProps {
  payments: IPayment[];
}

export function usePaymentsStats({ payments }: UsePaymentsStatsProps) {
  const stats = useMemo(() => {
    if (!payments?.length) {
      return {
        totalPayments: 0,
        paymentsToday: 0,
        sales: 0,
        expenses: 0,
        totalMonth: 0,
        salesAmount: 0,
        expensesAmount: 0,
        netBalance: 0,
      };
    }

    const today = new Date();
    const todayPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return (
        paymentDate.getDate() === today.getDate() &&
        paymentDate.getMonth() === today.getMonth() &&
        paymentDate.getFullYear() === today.getFullYear()
      );
    });

    const monthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return (
        paymentDate.getMonth() === today.getMonth() &&
        paymentDate.getFullYear() === today.getFullYear()
      );
    });

    const sales = payments.filter(payment => payment.type === 'sale');
    const expenses = payments.filter(payment => payment.type === 'expense');

    const salesAmount = sales.reduce((sum, payment) => sum + payment.amount, 0);
    const expensesAmount = expenses.reduce((sum, payment) => sum + payment.amount, 0);
    const totalMonth = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalPayments: payments.length,
      paymentsToday: todayPayments.length,
      sales: sales.length,
      expenses: expenses.length,
      totalMonth,
      salesAmount,
      expensesAmount,
      netBalance: salesAmount - expensesAmount,
    };
  }, [payments]);

  return stats;
} 