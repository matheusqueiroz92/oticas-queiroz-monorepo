export type ReportType =
  | "sales"
  | "inventory"
  | "customers"
  | "orders"
  | "financial";
export type ReportFormat = "json" | "pdf" | "excel" | "csv";
export type ReportStatus = "pending" | "processing" | "completed" | "error";

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string[];
  paymentMethod?: string[];
  productCategory?: string[];
  minValue?: number;
  maxValue?: number;
}

// Dados específicos para cada tipo de relatório
export type SalesReportData = {
  totalSales: number;
  averageSale: number;
  count: number;
  byPeriod: Array<{
    period: string;
    value: number;
    count: number;
  }>;
  byPaymentMethod: Record<string, number>;
};

export type InventoryReportData = {
  totalItems: number;
  totalValue: number;
  byCategory: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  lowStock: Array<{
    productId: string;
    name: string;
    stock: number;
  }>;
};

export type CustomersReportData = {
  totalCustomers: number;
  newCustomers: number;
  recurring: number;
  averagePurchase: number;
  byLocation: Record<string, number>;
};

export type OrdersReportData = {
  totalOrders: number;
  totalValue: number;
  averageValue: number;
  byStatus: Record<string, number>;
  byPeriod: Array<{
    period: string;
    count: number;
    value: number;
  }>;
};

export type FinancialReportData = {
  revenue: number;
  expenses: number;
  profit: number;
  byCategory: Record<string, number>;
  byPeriod: Array<{
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
};

export type ReportData =
  | SalesReportData
  | InventoryReportData
  | CustomersReportData
  | OrdersReportData
  | FinancialReportData
  | null;

export interface IReport {
  _id: string;
  name: string;
  type: ReportType;
  filters: ReportFilters;
  data: ReportData;
  createdBy: string;
  format: ReportFormat;
  status: ReportStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportDTO {
  name: string;
  type: ReportType;
  format: ReportFormat;
  filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string[];
    paymentMethod?: string[];
    productCategory?: string[];
    minValue?: number;
    maxValue?: number;
  };
}

export interface ReportsResponse {
  reports: IReport[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Mapas para tradução e opções
export const reportTypeMap: Record<ReportType, string> = {
  sales: "Vendas",
  inventory: "Inventário",
  customers: "Clientes",
  orders: "Pedidos",
  financial: "Financeiro",
};

export const reportStatusMap: Record<ReportStatus, string> = {
  pending: "Pendente",
  processing: "Em Processamento",
  completed: "Concluído",
  error: "Erro",
};

export const reportFormatMap: Record<ReportFormat, string> = {
  json: "JSON",
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
};

// Opções para formulários
export const reportTypeOptions = [
  { value: "sales", label: "Relatório de Vendas" },
  { value: "inventory", label: "Relatório de Inventário" },
  { value: "customers", label: "Relatório de Clientes" },
  { value: "orders", label: "Relatório de Pedidos" },
  { value: "financial", label: "Relatório Financeiro" },
];

export const reportFormatOptions = [
  { value: "excel", label: "Excel" },
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
];

export const orderStatusOptions = [
  { value: "pending", label: "Pendente" },
  { value: "in_production", label: "Em Produção" },
  { value: "ready", label: "Pronto" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

export const paymentMethodOptions = [
  { value: "credit", label: "Cartão de Crédito" },
  { value: "debit", label: "Cartão de Débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "installment", label: "Parcelado" },
];

export const productCategoryOptions = [
  { value: "grau", label: "Óculos de Grau" },
  { value: "solar", label: "Óculos de Sol" },
  { value: "lentes", label: "Lentes" },
  { value: "acessorios", label: "Acessórios" },
];
