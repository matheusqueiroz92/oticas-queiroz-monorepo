import { useMemo } from 'react';
import { useLaboratoryUtils } from './useLaboratoryUtils';
import type { Laboratory } from '@/app/_types/laboratory';

export function useLaboratoryStats(laboratories: Laboratory[], totalLaboratories: number) {
  const { calculateLaboratoryStats } = useLaboratoryUtils();
  
  const stats = useMemo(() => calculateLaboratoryStats(laboratories), [laboratories, calculateLaboratoryStats]);
  
  const realTotalLaboratories = totalLaboratories || 0;

  return {
    totalLaboratories: realTotalLaboratories,
    activeLaboratories: stats.activeLaboratories,
    inactiveLaboratories: stats.inactiveLaboratories,
    newThisMonth: stats.newThisMonth,
    topCities: stats.topCities,
  };
} 