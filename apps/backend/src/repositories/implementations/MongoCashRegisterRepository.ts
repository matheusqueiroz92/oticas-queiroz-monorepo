import { BaseRepository } from "./BaseRepository";
import { CashRegister } from "../../schemas/CashRegisterSchema";
import type { ICashRegister } from "../../interfaces/ICashRegister";
import type { ICashRegisterRepository } from "../interfaces/ICashRegisterRepository";
import { Types } from "mongoose";

/**
 * Implementação MongoDB do CashRegisterRepository
 * Fornece acesso a dados de caixas registradoras com operações especializadas
 */
export class MongoCashRegisterRepository extends BaseRepository<ICashRegister, Omit<ICashRegister, "_id">> implements ICashRegisterRepository {
  
  constructor() {
    super(CashRegister);
  }

  /**
   * Converte documento MongoDB para interface ICashRegister
   */
  protected convertToInterface(doc: any): ICashRegister {
    if (!doc) return doc;

    return {
      _id: doc._id?.toString(),
      openingDate: doc.openingDate,
      closingDate: doc.closingDate,
      openingBalance: doc.openingBalance || 0,
      currentBalance: doc.currentBalance || 0,
      closingBalance: doc.closingBalance,
      status: doc.status || "open",
      sales: {
        total: doc.sales?.total || 0,
        cash: doc.sales?.cash || 0,
        credit: doc.sales?.credit || 0,
        debit: doc.sales?.debit || 0,
        pix: doc.sales?.pix || 0,
        check: doc.sales?.check || 0
      },
      payments: {
        received: doc.payments?.received || 0,
        made: doc.payments?.made || 0
      },
      openedBy: doc.openedBy,
      closedBy: doc.closedBy,
      observations: doc.observations,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  /**
   * Constrói query baseada em filtros
   */
  protected buildFilterQuery(filters: Record<string, any>): Record<string, any> {
    const query: Record<string, any> = {};

    // Filtros básicos
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.openedBy) {
      query.openedBy = filters.openedBy;
    }

    if (filters.closedBy) {
      query.closedBy = filters.closedBy;
    }

    // Filtros de data
    if (filters.startDate || filters.endDate) {
      query.openingDate = {};
      if (filters.startDate) {
        query.openingDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.openingDate.$lte = new Date(filters.endDate);
      }
    }

    // Filtros de valor
    if (filters.minBalance) {
      query.currentBalance = { ...query.currentBalance, $gte: filters.minBalance };
    }

    if (filters.maxBalance) {
      query.currentBalance = { ...query.currentBalance, $lte: filters.maxBalance };
    }

    // Soft delete
    if (!filters.includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    return query;
  }

  /**
   * Busca caixa registradora aberta
   */
  async findOpenRegister(): Promise<ICashRegister | null> {
    try {
      const doc = await this.model.findOne({ 
        status: "open",
        isDeleted: { $ne: true }
      }).exec();

      return doc ? this.convertToInterface(doc) : null;
    } catch (error) {
      console.error('Erro ao buscar caixa aberta:', error);
      throw error;
    }
  }

  /**
   * Busca caixas por status
   */
  async findByStatus(
    status: "open" | "closed",
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { status });
  }

  /**
   * Busca caixas por data de abertura
   */
  async findByOpeningDate(
    startDate: Date,
    endDate: Date,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { startDate, endDate });
  }

  /**
   * Busca caixas por usuário que abriu
   */
  async findByOpenedBy(
    openedBy: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { openedBy });
  }

  /**
   * Busca caixas por usuário que fechou
   */
  async findByClosedBy(
    closedBy: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { closedBy });
  }

  /**
   * Fecha um caixa registradora
   */
  async closeRegister(
    id: string,
    closingData: {
      closingBalance: number;
      closedBy: string;
      observations?: string;
    }
  ): Promise<ICashRegister | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findByIdAndUpdate(
        id,
        { 
          $set: { 
            status: "closed",
            closingDate: new Date(),
            closingBalance: closingData.closingBalance,
            closedBy: closingData.closedBy,
            observations: closingData.observations,
            updatedAt: new Date()
          }
        },
        { new: true, runValidators: true }
      ).exec();

      return doc ? this.convertToInterface(doc) : null;
    } catch (error) {
      console.error(`Erro ao fechar caixa ${id}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza saldo atual do caixa
   */
  async updateBalance(
    id: string,
    amount: number,
    operation: "add" | "subtract"
  ): Promise<ICashRegister | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const updateValue = operation === "add" ? amount : -amount;

      const doc = await this.model.findByIdAndUpdate(
        id,
        { 
          $inc: { currentBalance: updateValue },
          $set: { updatedAt: new Date() }
        },
        { new: true, runValidators: true }
      ).exec();

      return doc ? this.convertToInterface(doc) : null;
    } catch (error) {
      console.error(`Erro ao atualizar saldo do caixa ${id}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza valores de vendas
   */
  async updateSales(
    id: string,
    salesData: Partial<ICashRegister["sales"]>
  ): Promise<ICashRegister | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const updateData: any = { $set: { updatedAt: new Date() } };

      Object.entries(salesData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData.$set[`sales.${key}`] = value;
        }
      });

      const doc = await this.model.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();

      return doc ? this.convertToInterface(doc) : null;
    } catch (error) {
      console.error(`Erro ao atualizar vendas do caixa ${id}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza valores de pagamentos
   */
  async updatePayments(
    id: string,
    paymentsData: Partial<ICashRegister["payments"]>
  ): Promise<ICashRegister | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const updateData: any = { $set: { updatedAt: new Date() } };

      Object.entries(paymentsData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData.$set[`payments.${key}`] = value;
        }
      });

      const doc = await this.model.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).exec();

      return doc ? this.convertToInterface(doc) : null;
    } catch (error) {
      console.error(`Erro ao atualizar pagamentos do caixa ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca resumo diário
   */
  async findDailySummary(date: Date): Promise<{
    openingBalance: number;
    currentBalance: number;
    totalSales: number;
    totalPaymentsReceived: number;
    salesByMethod: Record<string, number>;
  } | null> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const registers = await this.model.find({
        openingDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        isDeleted: { $ne: true }
      }).exec();

      if (registers.length === 0) {
        return null;
      }

      const summary = registers.reduce((acc, register) => {
        acc.openingBalance += register.openingBalance || 0;
        acc.currentBalance += register.currentBalance || 0;
        acc.totalSales += register.sales?.total || 0;
        acc.totalPaymentsReceived += register.payments?.received || 0;

        // Consolidar vendas por método
        if (register.sales) {
          acc.salesByMethod.cash += register.sales.cash || 0;
          acc.salesByMethod.credit += register.sales.credit || 0;
          acc.salesByMethod.debit += register.sales.debit || 0;
          acc.salesByMethod.pix += register.sales.pix || 0;
          acc.salesByMethod.check += register.sales.check || 0;
        }

        return acc;
      }, {
        openingBalance: 0,
        currentBalance: 0,
        totalSales: 0,
        totalPaymentsReceived: 0,
        salesByMethod: {
          cash: 0,
          credit: 0,
          debit: 0,
          pix: 0,
          check: 0
        }
      });

      return summary;
    } catch (error) {
      console.error('Erro ao buscar resumo diário:', error);
      throw error;
    }
  }

  /**
   * Busca caixas com diferença
   */
  async findWithDifference(
    minDifference: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ICashRegister[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;

      const pipeline = [
        {
          $match: {
            status: "closed",
            isDeleted: { $ne: true },
            closingBalance: { $exists: true }
          }
        },
        {
          $addFields: {
            difference: {
              $abs: { $subtract: ["$closingBalance", "$currentBalance"] }
            }
          }
        },
        {
          $match: {
            difference: { $gte: minDifference }
          }
        },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            count: [{ $count: "total" }]
          }
        }
      ];

      const results = await this.model.aggregate(pipeline).exec();
      const data = results[0]?.data || [];
      const total = results[0]?.count[0]?.total || 0;

      const items = data.map((doc: any) => this.convertToInterface(doc));

      return {
        items,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Erro ao buscar caixas com diferença:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de caixas
   */
  async getStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRegisters: number;
    totalSales: number;
    totalDifference: number;
    averageBalance: number;
    registersByStatus: Record<string, number>;
  }> {
    try {
      const pipeline = [
        {
          $match: {
            openingDate: {
              $gte: startDate,
              $lte: endDate
            },
            isDeleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: null,
            totalRegisters: { $sum: 1 },
            totalSales: { $sum: "$sales.total" },
            totalOpeningBalance: { $sum: "$openingBalance" },
            totalCurrentBalance: { $sum: "$currentBalance" },
            statusCounts: { $push: "$status" },
            differences: {
              $push: {
                $cond: [
                  { $and: [
                    { $eq: ["$status", "closed"] },
                    { $ne: ["$closingBalance", null] }
                  ]},
                  { $abs: { $subtract: ["$closingBalance", "$currentBalance"] } },
                  0
                ]
              }
            }
          }
        }
      ];

      const results = await this.model.aggregate(pipeline).exec();

      if (results.length === 0) {
        return {
          totalRegisters: 0,
          totalSales: 0,
          totalDifference: 0,
          averageBalance: 0,
          registersByStatus: { open: 0, closed: 0 }
        };
      }

      const result = results[0];

      // Processar contagem por status
      const registersByStatus = { open: 0, closed: 0 };
      result.statusCounts.forEach((status: string) => {
        if (status in registersByStatus) {
          registersByStatus[status as keyof typeof registersByStatus]++;
        }
      });

      // Calcular diferença total
      const totalDifference = result.differences.reduce((sum: number, diff: number) => sum + diff, 0);

      return {
        totalRegisters: result.totalRegisters || 0,
        totalSales: result.totalSales || 0,
        totalDifference,
        averageBalance: result.totalRegisters > 0 
          ? (result.totalCurrentBalance || 0) / result.totalRegisters 
          : 0,
        registersByStatus
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      throw error;
    }
  }
} 