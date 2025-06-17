import { Order } from "../../schemas/OrderSchema";
import { BaseRepository } from "./BaseRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import type { IOrder, CreateOrderDTO, IPaymentHistoryEntry } from "../../interfaces/IOrder";
import { Types } from "mongoose";

/**
 * Implementação do OrderRepository para MongoDB
 */
export class MongoOrderRepository extends BaseRepository<IOrder, CreateOrderDTO> implements IOrderRepository {
  constructor() {
    super(Order);
  }

  /**
   * Converte documento do MongoDB para IOrder
   */
  protected convertToInterface(doc: any): IOrder {
    if (!doc) {
      throw new Error("Documento não pode ser nulo");
    }

    const order = doc.toObject ? doc.toObject() : doc;

    return {
      _id: order._id?.toString(),
      clientId: order.clientId?.toString() || "",
      employeeId: order.employeeId?.toString() || "",
      institutionId: order.institutionId?.toString() || null,
      isInstitutionalOrder: order.isInstitutionalOrder || false,
      responsibleClientId: order.responsibleClientId?.toString(),
      hasResponsible: order.hasResponsible || false,
      products: Array.isArray(order.products) ? order.products : [],
      serviceOrder: order.serviceOrder,
      paymentMethod: order.paymentMethod || "",
      paymentStatus: order.paymentStatus || "pending",
      paymentHistory: Array.isArray(order.paymentHistory) 
        ? order.paymentHistory.map((entry: any) => ({
            paymentId: entry.paymentId?.toString() || "",
            amount: entry.amount || 0,
            date: entry.date || new Date(),
            method: entry.method || ""
          }))
        : [],
      paymentEntry: order.paymentEntry,
      installments: order.installments,
      orderDate: order.orderDate || new Date(),
      deliveryDate: order.deliveryDate,
      status: order.status || "pending",
      laboratoryId: order.laboratoryId?.toString() || null,
      prescriptionData: order.prescriptionData,
      observations: order.observations,
      totalPrice: order.totalPrice || 0,
      discount: order.discount || 0,
      finalPrice: order.finalPrice || 0,
      isDeleted: order.isDeleted || false,
      deletedAt: order.deletedAt,
      deletedBy: order.deletedBy?.toString(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  /**
   * Constrói query de filtros específica para pedidos
   */
  protected buildFilterQuery(filters: Record<string, any>): Record<string, any> {
    const query = super.buildFilterQuery(filters);

    // Filtros específicos para pedidos
    if (filters.clientId) {
      // Se clientId é um objeto com $in (busca por múltiplos IDs), usar diretamente
      if (typeof filters.clientId === 'object' && filters.clientId.$in) {
        query.clientId = filters.clientId;
      } else {
        // Se é um ID simples, converter para ObjectId
        query.clientId = new Types.ObjectId(filters.clientId);
      }
    }

    if (filters.employeeId) {
      query.employeeId = new Types.ObjectId(filters.employeeId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters.laboratoryId) {
      query.laboratoryId = new Types.ObjectId(filters.laboratoryId);
    }

    if (filters.serviceOrder) {
      query.serviceOrder = filters.serviceOrder;
    }

    // Filtro por data
    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) {
        query.orderDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.orderDate.$lte = new Date(filters.endDate);
      }
    }

    // Filtro por produtos
    if (filters.productId) {
      query["products._id"] = new Types.ObjectId(filters.productId);
    }

    return query;
  }

  /**
   * Busca IDs de clientes por termo de busca
   */
  private async findClientIdsBySearchTerm(searchTerm: string): Promise<string[]> {
    try {
      // Importar dinamicamente para evitar dependência circular
      const mongoose = require('mongoose');
      const UserModel = mongoose.model('User');

      const matchingClients = await UserModel.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { cpf: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ],
        role: 'customer'
      }).select('_id name role');
      
      return matchingClients.map((client: any) => client._id.toString());
    } catch (error) {
      console.error('Erro ao buscar clientes por termo:', error);
      return [];
    }
  }

  /**
   * Sobrescreve findAll para incluir busca por nome de cliente
   */
  async findAll(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {},
    includeDeleted = false,
    sortOptions?: Record<string, 1 | -1>
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }> {
    
    // Se há um termo de busca, buscar IDs dos clientes primeiro
    if (filters.search) {
      const clientIds = await this.findClientIdsBySearchTerm(filters.search);
      
      if (clientIds.length === 0) {
        return {
          items: [],
          total: 0,
          page,
          limit
        };
      }
      
      // Adicionar filtro de clientIds e remover o filtro search
      filters.clientId = { $in: clientIds.map(id => new Types.ObjectId(id)) };
      delete filters.search;
    }

    // Chamar o método pai com os filtros modificados
    return super.findAll(page, limit, filters, includeDeleted, sortOptions);
  }

  /**
   * Busca pedidos por cliente
   */
  async findByClientId(clientId: string, includeDeleted: boolean = false): Promise<IOrder[]> {
    try {
      if (!this.isValidId(clientId)) {
        return [];
      }

      const query: any = { clientId: new Types.ObjectId(clientId) };
      if (!includeDeleted) {
        query.isDeleted = { $ne: true };
      }

      const docs = await this.model.find(query)
        .populate('clientId', 'name email')
        .populate('employeeId', 'name')
        .populate('laboratoryId', 'name')
        .sort({ orderDate: -1 })
        .exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error(`Erro ao buscar pedidos do cliente ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Busca pedidos por funcionário
   */
  async findByEmployeeId(
    employeeId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { employeeId });
  }

  /**
   * Busca pedidos por número de O.S.
   */
  async findByServiceOrder(serviceOrder: string, includeDeleted: boolean = false): Promise<IOrder[]> {
    try {
      const query: any = { serviceOrder };
      if (!includeDeleted) {
        query.isDeleted = { $ne: true };
      }

      const docs = await this.model.find(query)
        .populate('clientId', 'name email')
        .populate('employeeId', 'name')
        .populate('laboratoryId', 'name')
        .exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error(`Erro ao buscar pedidos por O.S. ${serviceOrder}:`, error);
      throw error;
    }
  }

  /**
   * Busca pedidos por status
   */
  async findByStatus(
    status: IOrder["status"],
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { status });
  }

  /**
   * Busca pedidos por laboratório
   */
  async findByLaboratory(
    laboratoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { laboratoryId });
  }

  /**
   * Busca pedidos por intervalo de datas
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    includeDeleted: boolean = false
  ): Promise<IOrder[]> {
    try {
      const query: any = {
        orderDate: {
          $gte: startDate,
          $lte: endDate
        }
      };

      if (!includeDeleted) {
        query.isDeleted = { $ne: true };
      }

      const docs = await this.model.find(query)
        .populate('clientId', 'name email')
        .populate('employeeId', 'name')
        .populate('laboratoryId', 'name')
        .sort({ orderDate: -1 })
        .exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error('Erro ao buscar pedidos por intervalo de datas:', error);
      throw error;
    }
  }

  /**
   * Busca pedidos do dia
   */
  async findDailyOrders(date: Date = new Date()): Promise<IOrder[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findByDateRange(startOfDay, endOfDay);
  }

  /**
   * Busca pedidos por produto
   */
  async findByProductId(
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { productId });
  }

  /**
   * Atualiza status do pedido
   */
  async updateStatus(id: string, status: IOrder["status"]): Promise<IOrder | null> {
    return this.update(id, { status });
  }

  /**
   * Atualiza laboratório do pedido
   */
  async updateLaboratory(id: string, laboratoryId: string): Promise<IOrder | null> {
    return this.update(id, { laboratoryId });
  }

  /**
   * Busca pedidos com status de pagamento específico
   */
  async findByPaymentStatus(
    paymentStatus: IOrder["paymentStatus"],
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { paymentStatus });
  }

  /**
   * Busca pedidos deletados
   */
  async findDeleted(
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { includeDeleted: true, isDeleted: true });
  }

  /**
   * Busca pedidos com filtros avançados
   */
  async findWithFilters(
    filters: Record<string, any>,
    page: number = 1,
    limit: number = 10,
    includeDeleted: boolean = false
  ): Promise<{ items: IOrder[]; total: number; page: number; limit: number }> {
    const finalFilters = { ...filters, includeDeleted };
    return this.findAll(page, limit, finalFilters);
  }

  /**
   * Conta pedidos por status
   */
  async countByStatus(
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<IOrder["status"], number>> {
    try {
      const pipeline: any[] = [];

      // Filtrar por data se fornecida
      if (startDate || endDate) {
        const dateFilter: any = {};
        if (startDate) dateFilter.$gte = startDate;
        if (endDate) dateFilter.$lte = endDate;
        
        pipeline.push({
          $match: {
            orderDate: dateFilter,
            isDeleted: { $ne: true }
          }
        });
      } else {
        pipeline.push({
          $match: { isDeleted: { $ne: true } }
        });
      }

      // Agrupar por status e contar
      pipeline.push({
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      });

      const results = await this.model.aggregate(pipeline).exec();

      // Inicializar contadores para todos os status
      const statusCount: Record<IOrder["status"], number> = {
        pending: 0,
        in_production: 0,
        ready: 0,
        delivered: 0,
        cancelled: 0
      };

      // Preencher com os resultados da agregação
      results.forEach((result: any) => {
        if (result._id in statusCount) {
          statusCount[result._id as IOrder["status"]] = result.count;
        }
      });

      return statusCount;
    } catch (error) {
      console.error('Erro ao contar pedidos por status:', error);
      throw error;
    }
  }

  /**
   * Calcula receita por período
   */
  async getRevenueSummary(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    totalDiscount: number;
    finalRevenue: number;
    orderCount: number;
  }> {
    try {
      const pipeline = [
        {
          $match: {
            orderDate: {
              $gte: startDate,
              $lte: endDate
            },
            status: { $ne: "cancelled" },
            isDeleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalDiscount: { $sum: "$discount" },
            finalRevenue: { $sum: "$finalPrice" },
            orderCount: { $sum: 1 }
          }
        }
      ];

      const results = await this.model.aggregate(pipeline).exec();

      if (results.length === 0) {
        return {
          totalRevenue: 0,
          totalDiscount: 0,
          finalRevenue: 0,
          orderCount: 0
        };
      }

      const result = results[0];
      return {
        totalRevenue: result.totalRevenue || 0,
        totalDiscount: result.totalDiscount || 0,
        finalRevenue: result.finalRevenue || 0,
        orderCount: result.orderCount || 0
      };
    } catch (error) {
      console.error('Erro ao calcular resumo de receita:', error);
      throw error;
    }
  }
} 