import { RepositoryFactory } from "../repositories/RepositoryFactory";
import { ReportModel } from "../models/ReportModel";
import { ReportError } from "../interfaces/IReport";
import type {
  IReport,
  ReportFilters,
  SalesReportData,
  InventoryReportData,
  CustomersReportData,
  OrdersReportData,
  FinancialReportData,
  ReportData,
} from "../interfaces/IReport";
import { Order } from "../schemas/OrderSchema";
import { User } from "../schemas/UserSchema";
import { Payment } from "../schemas/PaymentSchema";
import { Product } from "../schemas/ProductSchema";

export class ReportService {
  private userRepository: any;
  private orderRepository: any;
  private paymentRepository: any;
  private productRepository: any;
  private reportModel: ReportModel;
  private reportCache = new Map<string, ReportData>();

  constructor() {
    const factory = RepositoryFactory.getInstance();
    this.userRepository = factory.getUserRepository();
    this.orderRepository = factory.getOrderRepository();
    this.paymentRepository = factory.getPaymentRepository();
    this.productRepository = factory.getProductRepository();
    this.reportModel = new ReportModel();
  }

  private async generateReportData(reportId: string): Promise<void> {
    const report = await this.reportModel.findById(reportId);
    if (!report) return;
  
    try {
      await this.reportModel.updateStatus(reportId, "processing");
  
      const cacheKey = `${report.type}_${JSON.stringify(report.filters)}`;
      if (this.reportCache.has(cacheKey)) {
        const cachedData = this.reportCache.get(cacheKey);
        await this.reportModel.updateStatus(reportId, "completed", cachedData!);
        return;
      }
  
      let data: ReportData = null;
      switch (report.type) {
        case "sales":
          data = await this.generateSalesReport(report.filters);
          break;
        case "inventory":
          data = await this.generateInventoryReport(report.filters);
          break;
        case "customers":
          data = await this.generateCustomersReport(report.filters);
          break;
        case "orders":
          data = await this.generateOrdersReport(report.filters);
          break;
        case "financial":
          data = await this.generateFinancialReport(report.filters);
          break;
      }
  
      this.reportCache.set(cacheKey, data);
      
      if (this.reportCache.size > 100) {
        const oldestKey = this.reportCache.keys().next().value;
        if (oldestKey) {
          this.reportCache.delete(oldestKey);
        }
      }
  
      await this.reportModel.updateStatus(reportId, "completed", data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      await this.reportModel.updateStatus(reportId, "error", null, errorMessage);
    }
  }

  private async generateSalesReport(
    filters: ReportFilters
  ): Promise<SalesReportData> {
    const query: Record<string, unknown> = {};

    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      query.paymentMethod = { $in: filters.paymentMethod };
    }

    const salesData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalSales: { $sum: "$totalPrice" },
          count: { $sum: 1 },
          averageSale: { $avg: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const byPeriod = salesData.map((item) => ({
      period: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      value: item.totalSales,
      count: item.count,
    }));

    const paymentMethodData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    const byPaymentMethod: Record<string, number> = {};
    for (const item of paymentMethodData) {
      byPaymentMethod[item._id] = item.total;
    }

    const totalSales = byPeriod.reduce((sum, item) => sum + item.value, 0);
    const totalCount = byPeriod.reduce((sum, item) => sum + item.count, 0);
    const averageSale = totalCount > 0 ? totalSales / totalCount : 0;

    return {
      totalSales,
      averageSale,
      count: totalCount,
      byPeriod,
      byPaymentMethod,
    };
  }

  private async generateInventoryReport(
    filters: ReportFilters
  ): Promise<InventoryReportData> {
    const query: Record<string, unknown> = {};

    if (filters.productCategory && filters.productCategory.length > 0) {
      query.productType = { $in: filters.productCategory };
    }

    const categoryData = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$productType",
          count: { $sum: 1 },
          value: { 
            $sum: { 
              $multiply: [
                { $ifNull: ["$currentPrice", "$basePrice"] }, 
                { $ifNull: ["$stock", 0] }
              ] 
            } 
          },
        },
      },
      { $sort: { value: -1 } },
    ]);

    const byCategory = categoryData.map((item) => ({
      category: item._id,
      count: item.count,
      value: item.value,
    }));

    const lowStockResult = await this.productRepository.findLowStock(5, 1, 10);
    const lowStock = lowStockResult.items.map((product: any) => ({
      productId: product._id?.toString() || product.id,
      name: product.name,
      stock: product.stock || 0,
    }));

    const totalItems = byCategory.reduce((sum, item) => sum + item.count, 0);
    const totalValue = byCategory.reduce((sum, item) => sum + item.value, 0);

    return {
      totalItems,
      totalValue,
      byCategory,
      lowStock,
    };
  }

  private async generateCustomersReport(
    filters: ReportFilters
  ): Promise<CustomersReportData> {
    const customersResult = await this.userRepository.findByRole("customer", 1, 1000);
    const customers = customersResult.items;

    let query: Record<string, unknown> = { role: "customer" };

    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    const periodData = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const byPeriod = periodData.map((item) => ({
      period: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      count: item.count,
    }));

    // Calcular clientes recorrentes
    const recurringCustomersData = await Order.aggregate([
      {
        $group: {
          _id: "$clientId",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalPrice" },
        },
      },
      { $match: { orderCount: { $gt: 1 } } },
    ]);

    // Calcular compra média
    const averagePurchaseData = await Order.aggregate([
      {
        $group: {
          _id: null,
          averagePurchase: { $avg: "$totalPrice" },
        },
      },
    ]);

    // Calcular dados por localização (estado)
    const locationData = await User.aggregate([
      { $match: { role: "customer" } },
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 },
        },
      },
    ]);

    const byLocation: Record<string, number> = {};
    for (const item of locationData) {
      if (item._id) {
        byLocation[item._id] = item.count;
      }
    }

    const totalCustomers = customers.length;
    const newCustomers = byPeriod.reduce((sum, item) => sum + item.count, 0);
    const recurring = recurringCustomersData.length;
    const averagePurchase = averagePurchaseData[0]?.averagePurchase || 0;

    return {
      totalCustomers,
      newCustomers,
      recurring,
      averagePurchase,
      byLocation,
    };
  }

  private async generateOrdersReport(
    filters: ReportFilters
  ): Promise<OrdersReportData> {
    const query: Record<string, unknown> = {};

    if (filters.startDate && filters.endDate) {
      query.orderDate = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    if (filters.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }

    const statusData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          value: { $sum: "$totalPrice" },
        },
      },
    ]);

    const byStatus: Record<string, number> = {};
    let totalValue = 0;
    for (const item of statusData) {
      byStatus[item._id] = item.count;
      totalValue += item.value;
    }

    const periodData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            month: { $month: "$orderDate" },
            year: { $year: "$orderDate" },
          },
          count: { $sum: 1 },
          value: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const byPeriod = periodData.map((item) => ({
      period: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      count: item.count,
      value: item.value,
    }));

    const totalOrders = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
    const averageValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    return {
      totalOrders,
      totalValue,
      averageValue,
      byStatus,
      byPeriod,
    };
  }

  private async generateFinancialReport(
    filters: ReportFilters
  ): Promise<FinancialReportData> {
    const query: Record<string, unknown> = {};

    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    const revenueData = await Payment.aggregate([
      { $match: { ...query, type: "sale" } },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const expenseData = await Payment.aggregate([
      { $match: { ...query, type: "expense" } },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          expenses: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Combinar dados de receita e despesas por período
    const periodMap = new Map<string, { revenue: number; expenses: number; profit: number }>();
    
    revenueData.forEach((item) => {
      const period = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      periodMap.set(period, {
        revenue: item.revenue,
        expenses: 0,
        profit: item.revenue,
      });
    });

    expenseData.forEach((item) => {
      const period = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      const existing = periodMap.get(period) || { revenue: 0, expenses: 0, profit: 0 };
      existing.expenses = item.expenses;
      existing.profit = existing.revenue - item.expenses;
      periodMap.set(period, existing);
    });

    const byPeriod = Array.from(periodMap.entries()).map(([period, data]) => ({
      period,
      ...data,
    }));

    // Dados por categoria de despesas
    const categoryData = await Payment.aggregate([
      { $match: { ...query, type: "expense" } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const byCategory: Record<string, number> = {};
    for (const item of categoryData) {
      if (item._id) {
        byCategory[item._id] = item.total;
      }
    }

    const revenue = byPeriod.reduce((sum, item) => sum + item.revenue, 0);
    const expenses = byPeriod.reduce((sum, item) => sum + item.expenses, 0);
    const profit = revenue - expenses;

    return {
      revenue,
      expenses,
      profit,
      byCategory,
      byPeriod,
    };
  }

  async createReport(
    name: string,
    type: IReport["type"],
    filters: ReportFilters,
    createdBy: string,
    format: IReport["format"] = "json"
  ): Promise<IReport> {
    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      throw new ReportError("Data inicial não pode ser maior que data final");
    }

    const reportData: Omit<IReport, "_id"> = {
      name,
      type,
      filters,
      createdBy,
      format,
      status: "pending",
      data: null,
    };

    const report = await this.reportModel.create(reportData);

    // Executar geração de dados de forma assíncrona (apenas fora de testes)
    if (process.env.NODE_ENV !== 'test') {
      setTimeout(() => this.generateReportData(report._id!), 100);
    }

    return report;
  }

  async getReport(id: string): Promise<IReport> {
    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new ReportError("Relatório não encontrado");
    }
    return report;
  }

  async getUserReports(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<{ reports: IReport[]; total: number }> {
    const result = await this.reportModel.findByUser(userId, page, limit);
    return result;
  }

  async getSalesStats(startDate?: Date, endDate?: Date) {
    const filters: ReportFilters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    return this.generateSalesReport(filters);
  }

  async getInventoryStats() {
    return this.generateInventoryReport({});
  }

  async getCustomerStats(startDate?: Date, endDate?: Date) {
    const filters: ReportFilters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    return this.generateCustomersReport(filters);
  }

  async getOrderStats(startDate?: Date, endDate?: Date, status?: string[]) {
    const filters: ReportFilters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;
    
    return this.generateOrdersReport(filters);
  }

  async getFinancialStats(startDate?: Date, endDate?: Date) {
    const filters: ReportFilters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    return this.generateFinancialReport(filters);
  }
}
