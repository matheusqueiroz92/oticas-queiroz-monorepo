"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_DASHBOARD_WIDGET_METRIC,
  isDashboardWidgetMetricId,
  type DashboardWidgetMetricId,
} from "@/app/_types/dashboard-widget";

const STORAGE_KEY_PREFIX = "dashboard-stat-widget";

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId || "guest"}`;
}

function readStoredMetric(userId: string): DashboardWidgetMetricId {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_WIDGET_METRIC;

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (isDashboardWidgetMetricId(raw)) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_DASHBOARD_WIDGET_METRIC;
}

export function useDashboardWidgetPreference(userId: string) {
  const [metricId, setMetricIdState] = useState<DashboardWidgetMetricId>(
    DEFAULT_DASHBOARD_WIDGET_METRIC
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setMetricIdState(readStoredMetric(userId));
    setIsHydrated(true);
  }, [userId]);

  const setMetricId = useCallback(
    (id: DashboardWidgetMetricId) => {
      setMetricIdState(id);
      try {
        window.localStorage.setItem(getStorageKey(userId), id);
      } catch {
        // ignore
      }
    },
    [userId]
  );

  return {
    metricId,
    setMetricId,
    isHydrated,
  };
}
