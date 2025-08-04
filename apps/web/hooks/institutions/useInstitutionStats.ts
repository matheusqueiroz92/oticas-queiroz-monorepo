"use client";

import { useMemo } from "react";
import { Institution } from "@/app/_types/institution";

interface InstitutionStats {
  totalInstitutions: number;
  activeInstitutions: number;
  inactiveInstitutions: number;
  institutionsWithContact: number;
  institutionsWithImage: number;
  averageInstitutionsPerMonth: number;
}

export function useInstitutionStats(institutions: Institution[] = []): InstitutionStats {
  return useMemo(() => {
    if (!institutions || institutions.length === 0) {
      return {
        totalInstitutions: 0,
        activeInstitutions: 0,
        inactiveInstitutions: 0,
        institutionsWithContact: 0,
        institutionsWithImage: 0,
        averageInstitutionsPerMonth: 0,
      };
    }

    const totalInstitutions = institutions.length;
    const activeInstitutions = institutions.filter(inst => inst.status === "active").length;
    const inactiveInstitutions = institutions.filter(inst => inst.status === "inactive").length;
    const institutionsWithContact = institutions.filter(inst => 
      inst.email || inst.phone || inst.address
    ).length;
    const institutionsWithImage = institutions.filter(inst => inst.image).length;

    // Calcular média por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentInstitutions = institutions.filter(inst => {
      if (!inst.createdAt) return false;
      const createdAt = new Date(inst.createdAt);
      return createdAt >= sixMonthsAgo;
    });

    const averageInstitutionsPerMonth = recentInstitutions.length / 6;

    return {
      totalInstitutions,
      activeInstitutions,
      inactiveInstitutions,
      institutionsWithContact,
      institutionsWithImage,
      averageInstitutionsPerMonth: Math.round(averageInstitutionsPerMonth * 10) / 10,
    };
  }, [institutions]);
}