import type { LucideIcon } from "lucide-react";
import {
  Clock,
  PackageCheck,
  Factory,
  Users,
  Wallet,
  AlertTriangle,
} from "lucide-react";

export type DashboardWidgetMetricId =
  | "pending_orders"
  | "ready_orders"
  | "in_production"
  | "new_clients_week"
  | "debt_payments_today"
  | "low_stock";

export const DEFAULT_DASHBOARD_WIDGET_METRIC: DashboardWidgetMetricId =
  "pending_orders";

export const DASHBOARD_WIDGET_METRIC_IDS: DashboardWidgetMetricId[] = [
  "pending_orders",
  "ready_orders",
  "in_production",
  "new_clients_week",
  "debt_payments_today",
  "low_stock",
];

export interface DashboardWidgetMetricConfig {
  id: DashboardWidgetMetricId;
  title: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  descriptionLabel: string;
  listHref?: string;
  listLabel?: string;
  valueType: "count" | "currency";
}

export const DASHBOARD_WIDGET_METRICS: Record<
  DashboardWidgetMetricId,
  DashboardWidgetMetricConfig
> = {
  pending_orders: {
    id: "pending_orders",
    title: "Pedidos pendentes",
    icon: Clock,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-100/10",
    descriptionLabel: "Aguardando processamento",
    listHref: "/orders?status=pending",
    listLabel: "Ver pedidos",
    valueType: "count",
  },
  ready_orders: {
    id: "ready_orders",
    title: "Prontos para entrega",
    icon: PackageCheck,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-100/10",
    descriptionLabel: "Aguardando retirada",
    listHref: "/orders?status=ready",
    listLabel: "Ver pedidos",
    valueType: "count",
  },
  in_production: {
    id: "in_production",
    title: "Em produção",
    icon: Factory,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-100/10",
    descriptionLabel: "No laboratório",
    listHref: "/orders?status=in_production",
    listLabel: "Ver pedidos",
    valueType: "count",
  },
  new_clients_week: {
    id: "new_clients_week",
    title: "Clientes esta semana",
    icon: Users,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-100/10",
    descriptionLabel: "Cadastros de domingo a sábado",
    listHref: "/customers",
    listLabel: "Ver clientes",
    valueType: "count",
  },
  debt_payments_today: {
    id: "debt_payments_today",
    title: "Recebimentos de dívidas",
    icon: Wallet,
    iconColor: "text-teal-600",
    bgColor: "bg-teal-100 dark:bg-teal-100/10",
    descriptionLabel: "Recebido hoje",
    listHref: "/payments",
    listLabel: "Ver pagamentos",
    valueType: "currency",
  },
  low_stock: {
    id: "low_stock",
    title: "Estoque baixo",
    icon: AlertTriangle,
    iconColor: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-100/10",
    descriptionLabel: "Armações com ≤5 un.",
    listHref: "/products",
    listLabel: "Ver produtos",
    valueType: "count",
  },
};

export function isDashboardWidgetMetricId(
  value: string | null | undefined
): value is DashboardWidgetMetricId {
  return (
    value !== null &&
    value !== undefined &&
    DASHBOARD_WIDGET_METRIC_IDS.includes(value as DashboardWidgetMetricId)
  );
}
