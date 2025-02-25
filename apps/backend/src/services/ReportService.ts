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
import { Product } from "../schemas/ProductSchema";
import { User } from "../schemas/UserSchema";
import { Payment } from "../schemas/PaymentSchema";

export class ReportService {
  private reportModel: ReportModel;

  constructor() {
    this.reportModel = new ReportModel();
  }

  async createReport(
    name: string,
    type: IReport["type"],
    filters: ReportFilters,
    createdBy: string,
    format: IReport["format"] = "json"
  ): Promise<IReport> {
    // Validar filtros
    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      throw new ReportError("Data inicial não pode ser maior que data final");
    }

    const report = await this.reportModel.create({
      name,
      type,
      filters,
      createdBy,
      format,
      status: "pending",
      data: null,
    });

    // Iniciar geração assíncrona do relatório
    if (report?._id) {
      this.generateReportData(report._id).catch(console.error);
    }

    return report;
  }

  private async generateReportData(reportId: string): Promise<void> {
    const report = await this.reportModel.findById(reportId);
    if (!report) return;

    try {
      await this.reportModel.updateStatus(reportId, "processing");

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

      await this.reportModel.updateStatus(reportId, "completed", data);
    } catch (error) {
      await this.reportModel.updateStatus(
        reportId,
        "error",
        null,
        error instanceof Error ? error.message : "Erro desconhecido"
      );
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

    // Transformar os dados agregados para o formato desejado
    const byPeriod = salesData.map((item) => ({
      period: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      value: item.totalSales,
      count: item.count,
    }));

    // Dados por método de pagamento
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

    // Calcular totais
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
      query.category = { $in: filters.productCategory };
    }

    // Dados por categoria
    const categoryData = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          value: { $sum: { $multiply: ["$price", "$stock"] } },
        },
      },
      { $sort: { value: -1 } },
    ]);

    const byCategory = categoryData.map((item) => ({
      category: item._id,
      count: item.count,
      value: item.value,
    }));

    // Produtos com estoque baixo
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } })
      .select("_id name stock")
      .limit(10)
      .lean();

    const lowStock = lowStockProducts.map((product) => ({
      productId: product._id.toString(),
      name: product.name,
      stock: product.stock,
    }));

    // Calcular totais
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
    const query: Record<string, unknown> = { role: "customer" };

    // Dados básicos de clientes
    const customersData = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          averagePurchase: { $avg: "$totalPurchases" },
        },
      },
    ]);

    // Calcular novos clientes no período
    const newCustomersQuery: Record<string, unknown> = {
      role: "customer",
    };

    if (filters.startDate) {
      newCustomersQuery.createdAt = { $gte: filters.startDate };
    }

    if (filters.endDate) {
      if (newCustomersQuery.createdAt) {
        newCustomersQuery.createdAt = {
          ...(newCustomersQuery.createdAt as Record<string, unknown>),
          $lte: filters.endDate,
        };
      } else {
        newCustomersQuery.createdAt = { $lte: filters.endDate };
      }
    }

    const newCustomers = await User.countDocuments(newCustomersQuery);

    // Dados por localização (usando o endereço)
    const locationData = await User.aggregate([
      { $match: { role: "customer", address: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$address",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const byLocation: Record<string, number> = {};
    for (const item of locationData) {
      byLocation[item._id] = item.count;
    }
    // Clientes recorrentes (com mais de um pedido)
    const recurringCustomers = await User.countDocuments({
      role: "customer",
      "purchases.1": { $exists: true }, // Pelo menos 2 compras
    });

    return {
      totalCustomers: customersData[0]?.totalCustomers ?? 0,
      newCustomers,
      recurring: recurringCustomers,
      averagePurchase: customersData[0]?.averagePurchase || 0,
      byLocation,
    };
  }

  private async generateOrdersReport(
    filters: ReportFilters
  ): Promise<OrdersReportData> {
    const query: Record<string, unknown> = {};

    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    if (filters.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }

    // Dados por período
    const periodData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
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

    // Dados por status
    const statusData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const byStatus: Record<string, number> = {};
    for (const item of statusData) {
      byStatus[item._id] = item.count;
    }

    // Calcular totais
    const totalOrders = byPeriod.reduce((sum, item) => sum + item.count, 0);
    const totalValue = byPeriod.reduce((sum, item) => sum + item.value, 0);
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
      query.paymentDate = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    // Receita e despesas por período
    const periodData = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            month: { $month: "$paymentDate" },
            year: { $year: "$paymentDate" },
            type: "$type",
          },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Transformar os dados em formato mais usável
    const periodMap = new Map<string, { revenue: number; expenses: number }>();
    for (const item of periodData) {
      const period = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      const entry = periodMap.get(period) ?? { revenue: 0, expenses: 0 };

      if (item._id.type === "expense") {
        entry.expenses += item.amount;
      } else {
        entry.revenue += item.amount;
      }

      periodMap.set(period, entry);
    }

    // Converter para o formato final
    const byPeriod = Array.from(periodMap.entries()).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
    }));

    // Dados por categoria
    const categoryData = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const byCategory: Record<string, number> = {};
    for (const item of categoryData) {
      if (item._id) {
        byCategory[item._id] = item.amount;
      }
    }

    // Calcular totais
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

  async getReport(id: string): Promise<IReport> {
    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new ReportError("Relatório não encontrado");
    }
    return report;
  }

  async getUserReports(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<{ reports: IReport[]; total: number }> {
    return await this.reportModel.findByUser(userId, page, limit);
  }
}
