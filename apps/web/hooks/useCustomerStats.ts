import { useMemo } from 'react';
import { useCustomerUtils } from './useCustomerUtils';
import type { User } from '@/app/_types/user';

export function useCustomerStats(customers: User[], totalCustomers: number) {
  const { calculateCustomerStats } = useCustomerUtils();
  
  const stats = useMemo(() => calculateCustomerStats(customers), [customers, calculateCustomerStats]);
  
  const realTotalCustomers = totalCustomers || 0;

  return {
    totalCustomers: realTotalCustomers,
    vipCustomers: stats.vipCustomers,
    newThisMonth: stats.newThisMonth,
    activeCustomers: stats.activeCustomers,
  };
} 