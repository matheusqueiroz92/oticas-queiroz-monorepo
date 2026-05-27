"use client";

import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardWidgetPreference } from "@/hooks/dashboard/useDashboardWidgetPreference";
import { useDashboardWidgetMetrics } from "@/hooks/dashboard/useDashboardWidgetMetrics";
import {
  DASHBOARD_WIDGET_METRIC_IDS,
  DASHBOARD_WIDGET_METRICS,
  type DashboardWidgetMetricId,
} from "@/app/_types/dashboard-widget";
import { ArrowRight, Check, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

interface DashboardConfigurableStatCardProps {
  userId: string;
  weeklyCustomersCount: number;
}

export function DashboardConfigurableStatCard({
  userId,
  weeklyCustomersCount,
}: DashboardConfigurableStatCardProps) {
  const { metricId, setMetricId, isHydrated } = useDashboardWidgetPreference(userId);

  const { config, value, isLoading } = useDashboardWidgetMetrics({
    metricId,
    userId,
    weeklyCustomersCount,
    enabled: isHydrated,
  });

  const headerAction = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Escolher métrica do card"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Métrica exibida</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DASHBOARD_WIDGET_METRIC_IDS.map((id) => {
          const item = DASHBOARD_WIDGET_METRICS[id];
          const ItemIcon = item.icon;
          return (
            <DropdownMenuItem
              key={id}
              onClick={() => setMetricId(id as DashboardWidgetMetricId)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ItemIcon className={`h-4 w-4 ${item.iconColor}`} />
              <span className="flex-1">{item.title}</span>
              {metricId === id && <Check className="h-4 w-4 text-[var(--primary-blue)]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const footerAction =
    config.listHref && config.listLabel ? (
      <Button
        asChild
        size="sm"
        variant="outline"
        className="shrink-0 text-[var(--primary-blue)] border-[var(--primary-blue)]/30 hover:bg-[var(--primary-blue)]/10"
      >
        <Link href={config.listHref} className="hover:bg-primary/5 hover:text-primary">
          {config.listLabel}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    ) : undefined;

  return (
    <StatCard
      title={config.title}
      value={value}
      icon={config.icon}
      iconColor={config.iconColor}
      bgColor={config.bgColor}
      isLoading={!isHydrated || isLoading}
      skeletonWidth={config.valueType === "currency" ? "w-28" : "w-16"}
      headerAction={headerAction}
      description={
        <span className="text-muted-foreground">{config.descriptionLabel}</span>
      }
      footerAction={footerAction}
    />
  );
}
