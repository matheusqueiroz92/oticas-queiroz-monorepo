import { useMemo } from 'react';
import { useEmployeeUtils } from './useEmployeeUtils';
import type { User } from '@/app/_types/user';

export function useEmployeeStats(employees: User[], totalEmployees: number) {
  const { calculateEmployeeStats } = useEmployeeUtils();
  
  const stats = useMemo(() => calculateEmployeeStats(employees), [employees, calculateEmployeeStats]);
  
  const realTotalEmployees = totalEmployees || 0;

  return {
    totalEmployees: realTotalEmployees,
    topEmployees: stats.topEmployees,
    newThisMonth: stats.newThisMonth,
    activeEmployees: stats.activeEmployees,
    totalSales: stats.totalSales,
    totalRevenue: stats.totalRevenue,
  };
} 