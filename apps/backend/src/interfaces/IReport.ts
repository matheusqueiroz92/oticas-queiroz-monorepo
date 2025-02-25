export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string[];
  paymentMethod?: string[];
  productCategory?: string[];
  minValue?: number;
  maxValue?: number;
}

// Definir um tipo para os dados dos relatórios baseado nos tipos possíveis
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

// União de todos os tipos possíveis de dados de relatório
export type ReportData =
  | SalesReportData
  | InventoryReportData
  | CustomersReportData
  | OrdersReportData
  | FinancialReportData
  | null;

export interface IReport {
  _id?: string;
  name: string;
  type: "sales" | "inventory" | "customers" | "orders" | "financial";
  filters: ReportFilters;
  data: ReportData;
  createdBy: string;
  format: "json" | "pdf" | "excel";
  status: "pending" | "processing" | "completed" | "error";
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportError";
  }
}
