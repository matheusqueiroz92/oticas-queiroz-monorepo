import { Payment } from "../../schemas/PaymentSchema";
import { BaseRepository } from "./BaseRepository";
import { IPaymentRepository } from "../interfaces/IPaymentRepository";
import type { IPayment, CreatePaymentDTO } from "../../interfaces/IPayment";
import { Types } from "mongoose";

/**
 * Implementação do PaymentRepository para MongoDB
 */
export class MongoPaymentRepository extends BaseRepository<IPayment, CreatePaymentDTO> implements IPaymentRepository {
  constructor() {
    super(Payment);
  }

  /**
   * Converte documento do MongoDB para IPayment
   */
  protected convertToInterface(doc: any): IPayment {
    if (!doc) {
      throw new Error("Documento não pode ser nulo");
    }

    const payment = doc.toObject ? doc.toObject() : doc;

    return {
      _id: payment._id?.toString(),
      createdBy: payment.createdBy?.toString() || "",
      customerId: payment.customerId?.toString(),
      institutionId: payment.institutionId?.toString(),
      isInstitutionalPayment: payment.isInstitutionalPayment || false,
      legacyClientId: payment.legacyClientId?.toString(),
      orderId: payment.orderId?.toString(),
      cashRegisterId: payment.cashRegisterId?.toString() || "",
      amount: payment.amount || 0,
      date: payment.date || new Date(),
      type: payment.type || "sale",
      paymentMethod: payment.paymentMethod || "cash",
      status: payment.status || "pending",
      mercadoPagoId: payment.mercadoPagoId,
      mercadoPagoData: payment.mercadoPagoData,
      creditCardInstallments: payment.creditCardInstallments ? {
        current: payment.creditCardInstallments.current,
        total: payment.creditCardInstallments.total || 1,
        value: payment.creditCardInstallments.value
      } : undefined,
      bank_slip: payment.bank_slip ? {
        code: payment.bank_slip.code || "",
        bank: payment.bank_slip.bank || ""
      } : undefined,
      promissoryNote: payment.promissoryNote ? {
        number: payment.promissoryNote.number || ""
      } : undefined,
      check: payment.check ? {
        bank: payment.check.bank || "",
        checkNumber: payment.check.checkNumber || "",
        checkDate: payment.check.checkDate || new Date(),
        accountHolder: payment.check.accountHolder || "",
        branch: payment.check.branch || "",
        accountNumber: payment.check.accountNumber || "",
        presentationDate: payment.check.presentationDate,
        compensationStatus: payment.check.compensationStatus || "pending",
        rejectionReason: payment.check.rejectionReason
      } : undefined,
      clientDebt: payment.clientDebt ? {
        generateDebt: payment.clientDebt.generateDebt || false,
        installments: payment.clientDebt.installments ? {
          total: payment.clientDebt.installments.total || 1,
          value: payment.clientDebt.installments.value || 0
        } : undefined,
        dueDates: Array.isArray(payment.clientDebt.dueDates) 
          ? payment.clientDebt.dueDates 
          : []
      } : undefined,
      description: payment.description,
      isDeleted: payment.isDeleted || false,
      deletedAt: payment.deletedAt,
      deletedBy: payment.deletedBy?.toString(),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
  }

  /**
   * Constrói query de filtros específica para pagamentos
   */
  protected buildFilterQuery(filters: Record<string, any>): Record<string, any> {
    const query = super.buildFilterQuery(filters);

    // Filtros específicos para pagamentos
    if (filters.customerId) {
      query.customerId = new Types.ObjectId(filters.customerId);
    }

    if (filters.orderId) {
      query.orderId = new Types.ObjectId(filters.orderId);
    }

    if (filters.cashRegisterId) {
      query.cashRegisterId = new Types.ObjectId(filters.cashRegisterId);
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.paymentMethod) {
      query.paymentMethod = filters.paymentMethod;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.createdBy) {
      query.createdBy = new Types.ObjectId(filters.createdBy);
    }

    // Filtro por data
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    // Filtro para cheques por status de compensação
    if (filters.checkCompensationStatus) {
      query["check.compensationStatus"] = filters.checkCompensationStatus;
    }

    return query;
  }

  /**
   * Busca pagamentos por pedido
   */
  async findByOrderId(orderId: string): Promise<IPayment[]> {
    try {
      if (!this.isValidId(orderId)) {
        return [];
      }

      const docs = await this.model.find({
        orderId: new Types.ObjectId(orderId),
        isDeleted: { $ne: true }
      })
      .populate('customerId', 'name email')
      .populate('createdBy', 'name')
      .populate('cashRegisterId', 'name')
      .sort({ date: -1 })
      .exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error(`Erro ao buscar pagamentos do pedido ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Busca pagamentos por cliente
   */
  async findByClientId(
    clientId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { customerId: clientId });
  }

  /**
   * Busca pagamentos por caixa
   */
  async findByCashRegisterId(
    cashRegisterId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { cashRegisterId });
  }

  /**
   * Busca pagamentos por tipo
   */
  async findByType(
    type: IPayment["type"],
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { type });
  }

  /**
   * Busca pagamentos por método
   */
  async findByPaymentMethod(
    paymentMethod: IPayment["paymentMethod"],
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { paymentMethod });
  }

  /**
   * Busca pagamentos por status
   */
  async findByStatus(
    status: IPayment["status"],
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { status });
  }

  /**
   * Busca pagamentos por intervalo de datas
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<IPayment[]> {
    try {
      const docs = await this.model.find({
        date: {
          $gte: startDate,
          $lte: endDate
        },
        isDeleted: { $ne: true }
      })
      .populate('customerId', 'name email')
      .populate('createdBy', 'name')
      .populate('cashRegisterId', 'name')
      .sort({ date: -1 })
      .exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error('Erro ao buscar pagamentos por intervalo de datas:', error);
      throw error;
    }
  }

  /**
   * Busca cheques por status
   */
  async findChecksByStatus(
    status: "pending" | "compensated" | "rejected",
    startDate?: Date,
    endDate?: Date
  ): Promise<IPayment[]> {
    try {
      const query: any = {
        paymentMethod: "check",
        "check.compensationStatus": status,
        isDeleted: { $ne: true }
      };

      // Filtro por data se fornecido
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      const docs = await this.model.find(query)
        .populate('customerId', 'name email')
        .populate('createdBy', 'name')
        .populate('cashRegisterId', 'name')
        .sort({ date: -1 })
        .exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error(`Erro ao buscar cheques com status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Busca pagamentos diários
   */
  async findDailyPayments(date: Date = new Date(), cashRegisterId?: string): Promise<IPayment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const query: any = {
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        isDeleted: { $ne: true }
      };

      if (cashRegisterId && this.isValidId(cashRegisterId)) {
        query.cashRegisterId = new Types.ObjectId(cashRegisterId);
      }

      const docs = await this.model.find(query)
        .populate('customerId', 'name email')
        .populate('createdBy', 'name')
        .populate('cashRegisterId', 'name')
        .sort({ date: -1 })
        .exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error('Erro ao buscar pagamentos diários:', error);
      throw error;
    }
  }

  /**
   * Busca pagamentos com filtros do MongoDB
   */
  async findWithMongoFilters(
    page: number,
    limit: number,
    filters: Record<string, any>,
    populate: boolean = true
  ): Promise<{ items: IPayment[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      
      let query = this.model.find(filters).skip(skip).limit(limit);
      
      if (populate) {
        query = query
          .populate('customerId', 'name email')
          .populate('createdBy', 'name')
          .populate('cashRegisterId', 'name')
          .populate('orderId', 'serviceOrder');
      }

      const [docs, total] = await Promise.all([
        query.sort({ date: -1 }).exec(),
        this.model.countDocuments(filters).exec()
      ]);

      const items = docs.map(doc => this.convertToInterface(doc));

      return {
        items,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Erro ao buscar pagamentos com filtros MongoDB:', error);
      throw error;
    }
  }

  /**
   * Calcula total de pagamentos por período
   */
  async calculateTotalByPeriod(
    startDate: Date,
    endDate: Date,
    type?: IPayment["type"]
  ): Promise<number> {
    try {
      const pipeline: any[] = [
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            },
            status: "completed",
            isDeleted: { $ne: true }
          }
        }
      ];

      // Filtrar por tipo se fornecido
      if (type) {
        pipeline[0].$match.type = type;
      }

      // Agrupar e somar valores
      pipeline.push({
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      });

      const results = await this.model.aggregate(pipeline).exec();
      
      return results.length > 0 ? results[0].total || 0 : 0;
    } catch (error) {
      console.error('Erro ao calcular total de pagamentos:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de pagamentos por método
   */
  async getPaymentMethodStats(
    startDate: Date,
    endDate: Date
  ): Promise<Record<IPayment["paymentMethod"], { count: number; total: number }>> {
    try {
      const pipeline = [
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            },
            status: "completed",
            isDeleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            total: { $sum: "$amount" }
          }
        }
      ];

      const results = await this.model.aggregate(pipeline).exec();

      // Inicializar estatísticas para todos os métodos
      const stats: Record<IPayment["paymentMethod"], { count: number; total: number }> = {
        credit: { count: 0, total: 0 },
        debit: { count: 0, total: 0 },
        cash: { count: 0, total: 0 },
        pix: { count: 0, total: 0 },
        bank_slip: { count: 0, total: 0 },
        promissory_note: { count: 0, total: 0 },
        check: { count: 0, total: 0 },
        mercado_pago: { count: 0, total: 0 }
      };

      // Preencher com os resultados da agregação
      results.forEach((result: any) => {
        if (result._id in stats) {
          stats[result._id as IPayment["paymentMethod"]] = {
            count: result.count,
            total: result.total
          };
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao calcular estatísticas por método de pagamento:', error);
      throw error;
    }
  }

  /**
   * Busca pagamentos pendentes de um cliente
   */
  async findPendingByClientId(clientId: string): Promise<IPayment[]> {
    try {
      if (!this.isValidId(clientId)) {
        return [];
      }

      const docs = await this.model.find({
        customerId: new Types.ObjectId(clientId),
        status: "pending",
        isDeleted: { $ne: true }
      })
      .populate('createdBy', 'name')
      .populate('cashRegisterId', 'name')
      .sort({ date: -1 })
      .exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error(`Erro ao buscar pagamentos pendentes do cliente ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Cancela um pagamento
   */
  async cancel(id: string, cancelledBy: string, reason?: string): Promise<IPayment | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const updateData: any = {
        status: "cancelled",
        updatedAt: new Date()
      };

      if (reason) {
        updateData.description = updateData.description 
          ? `${updateData.description} | Cancelado: ${reason}`
          : `Cancelado: ${reason}`;
      }

      const doc = await this.model.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao cancelar pagamento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca receita total por período e tipo
   */
  async getRevenueSummary(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSales: number;
    totalDebtPayments: number;
    totalExpenses: number;
    dailyBalance: number;
    paymentsByMethod: Record<IPayment["paymentMethod"], number>;
  }> {
    try {
      const pipeline = [
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            },
            status: "completed",
            isDeleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: {
              $sum: {
                $cond: [{ $eq: ["$type", "sale"] }, "$amount", 0]
              }
            },
            totalDebtPayments: {
              $sum: {
                $cond: [{ $eq: ["$type", "debt_payment"] }, "$amount", 0]
              }
            },
            totalExpenses: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
              }
            },
            // Agrupar por método de pagamento
            paymentsByMethod: {
              $push: {
                method: "$paymentMethod",
                amount: "$amount"
              }
            }
          }
        }
      ];

      const results = await this.model.aggregate(pipeline).exec();

      if (results.length === 0) {
        return {
          totalSales: 0,
          totalDebtPayments: 0,
          totalExpenses: 0,
          dailyBalance: 0,
          paymentsByMethod: {
            credit: 0,
            debit: 0,
            cash: 0,
            pix: 0,
            bank_slip: 0,
            promissory_note: 0,
            check: 0,
            mercado_pago: 0
          }
        };
      }

      const result = results[0];
      
      // Calcular saldo diário (vendas + pagamentos de dívidas - despesas)
      const dailyBalance = (result.totalSales || 0) + (result.totalDebtPayments || 0) - (result.totalExpenses || 0);

      // Processar pagamentos por método
      const paymentsByMethod: Record<IPayment["paymentMethod"], number> = {
        credit: 0,
        debit: 0,
        cash: 0,
        pix: 0,
        bank_slip: 0,
        promissory_note: 0,
        check: 0,
        mercado_pago: 0
      };

      if (Array.isArray(result.paymentsByMethod)) {
        result.paymentsByMethod.forEach((payment: any) => {
          if (payment.method in paymentsByMethod) {
            paymentsByMethod[payment.method as IPayment["paymentMethod"]] += payment.amount || 0;
          }
        });
      }

      return {
        totalSales: result.totalSales || 0,
        totalDebtPayments: result.totalDebtPayments || 0,
        totalExpenses: result.totalExpenses || 0,
        dailyBalance,
        paymentsByMethod
      };
    } catch (error) {
      console.error('Erro ao calcular resumo de receita:', error);
      throw error;
    }
  }
} 