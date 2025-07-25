"use client";

import { useMemo } from "react";
import type { Report, ReportStatus } from "@/app/_types/report";

interface ReportStats {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  processingReports: number;
  errorReports: number;
  recentReports: number;
}

export function useReportStats(reports: Report[]): ReportStats {
  return useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = reports.reduce(
      (acc, report) => {
        acc.totalReports++;

        switch (report.status as ReportStatus) {
          case "completed":
            acc.completedReports++;
            break;
          case "pending":
            acc.pendingReports++;
            break;
          case "processing":
            acc.processingReports++;
            break;
          case "error":
            acc.errorReports++;
            break;
        }

        // Relatórios dos últimos 30 dias
        const reportDate = new Date(report.createdAt);
        if (reportDate >= thirtyDaysAgo) {
          acc.recentReports++;
        }

        return acc;
      },
      {
        totalReports: 0,
        completedReports: 0,
        pendingReports: 0,
        processingReports: 0,
        errorReports: 0,
        recentReports: 0,
      }
    );

    return stats;
  }, [reports]);
} 