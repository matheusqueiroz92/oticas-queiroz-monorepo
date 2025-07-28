"use client";

import { useMemo } from "react";
import type { LegacyClient } from "@/app/_types/legacy-client";

interface LegacyClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalDebt: number;
  averageDebt: number;
  recentClients: number;
}

export function useLegacyClientStats(clients: LegacyClient[]): LegacyClientStats {
  return useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(client => client.status === "active").length;
    const inactiveClients = clients.filter(client => client.status === "inactive").length;
    
    const totalDebt = clients.reduce((sum, client) => sum + (client.debt || 0), 0);
    const averageDebt = totalClients > 0 ? totalDebt / totalClients : 0;
    
    // Clientes criados nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentClients = clients.filter(client => 
      client.createdAt && new Date(client.createdAt) > thirtyDaysAgo
    ).length;

    return {
      totalClients,
      activeClients,
      inactiveClients,
      totalDebt,
      averageDebt,
      recentClients,
    };
  }, [clients]);
} 