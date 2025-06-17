import { BaseRepository } from "./BaseRepository";
import type { ILegacyClientRepository } from "../interfaces/ILegacyClientRepository";
import type { ILegacyClient } from "../../interfaces/ILegacyClient";
import { LegacyClient } from "../../schemas/LegacyClientSchema";

// Tipo para resultado paginado
type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export class MongoLegacyClientRepository 
  extends BaseRepository<ILegacyClient> 
  implements ILegacyClientRepository 
{
  constructor() {
    super(LegacyClient);
  }

  protected convertToInterface(doc: any): ILegacyClient {
    return {
      _id: doc._id?.toString(),
      name: doc.name,
      cpf: doc.cpf,
      email: doc.email,
      phone: doc.phone,
      address: doc.address,
      totalDebt: doc.totalDebt || 0,
      status: doc.status || 'active',
      paymentHistory: doc.paymentHistory?.map((payment: any) => ({
        paymentId: payment._id?.toString() || payment.paymentId?.toString(),
        amount: payment.amount || 0,
        date: payment.date ? new Date(payment.date) : new Date(),
        description: payment.description,
        method: payment.method
      })) || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  /**
   * Busca cliente por documento (CPF/CNPJ)
   */
  async findByDocument(cpf: string): Promise<ILegacyClient | null> {
    try {
      const cleanDocument = cpf.replace(/\D/g, "");
      const client = await LegacyClient.findOne({ 
        cpf: { $in: [cpf, cleanDocument] } 
      });
      return client ? this.convertToInterface(client) : null;
    } catch (error) {
      console.error("Erro ao buscar cliente por documento:", error);
      throw error;
    }
  }

  /**
   * Busca clientes com dívidas
   */
  async findDebtors(minDebt?: number, maxDebt?: number): Promise<ILegacyClient[]> {
    try {
      const query: any = { totalDebt: { $gt: 0 } };
      
      if (minDebt !== undefined) {
        query.totalDebt.$gte = minDebt;
      }
      
      if (maxDebt !== undefined) {
        query.totalDebt.$lte = maxDebt;
      }

      const debtors = await LegacyClient.find(query)
        .sort({ totalDebt: -1 });
      
      return debtors.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error("Erro ao buscar devedores:", error);
      throw error;
    }
  }

  /**
   * Obtém histórico de pagamentos
   */
  async getPaymentHistory(
    id: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<ILegacyClient["paymentHistory"]> {
    try {
      const client = await LegacyClient.findById(id);
      if (!client || !client.paymentHistory) {
        return [];
      }

      const convertedClient = this.convertToInterface(client);
      let history = convertedClient.paymentHistory;

      // Filtrar por data se fornecidas
      if (startDate || endDate) {
        history = history.filter(payment => {
          const paymentDate = new Date(payment.date);
          
          if (startDate && paymentDate < startDate) return false;
          if (endDate && paymentDate > endDate) return false;
          
          return true;
        });
      }

      return history.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error("Erro ao obter histórico de pagamentos:", error);
      throw error;
    }
  }

  /**
   * Busca com filtros e paginação
   */
  async findAllWithFilters(
    filters: Partial<ILegacyClient>,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<ILegacyClient>> {
    try {
      const query: any = {};

      // Aplicar filtros
      if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
      }
      
      if (filters.cpf) {
        query.cpf = filters.cpf;
      }
      
      if (filters.email) {
        query.email = { $regex: filters.email, $options: 'i' };
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.totalDebt !== undefined) {
        query.totalDebt = filters.totalDebt;
      }

      const skip = (page - 1) * limit;
      
      const [docs, total] = await Promise.all([
        LegacyClient.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        LegacyClient.countDocuments(query)
      ]);

      return {
        items: docs.map(doc => this.convertToInterface(doc)),
        total,
        page,
        limit
      };
    } catch (error) {
      console.error("Erro ao buscar clientes com filtros:", error);
      throw error;
    }
  }

  /**
   * Busca por status
   */
  async findByStatus(
    status: "active" | "inactive", 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResult<ILegacyClient>> {
    try {
      const skip = (page - 1) * limit;
      
      const [docs, total] = await Promise.all([
        LegacyClient.find({ status })
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        LegacyClient.countDocuments({ status })
      ]);

      return {
        items: docs.map(doc => this.convertToInterface(doc)),
        total,
        page,
        limit
      };
    } catch (error) {
      console.error("Erro ao buscar clientes por status:", error);
      throw error;
    }
  }

  /**
   * Atualiza dívida total
   */
  async updateTotalDebt(id: string, totalDebt: number): Promise<boolean> {
    try {
      const result = await LegacyClient.findByIdAndUpdate(
        id,
        { totalDebt },
        { new: true }
      );
      return !!result;
    } catch (error) {
      console.error("Erro ao atualizar dívida total:", error);
      return false;
    }
  }

  /**
   * Adiciona pagamento ao histórico
   */
  async addPayment(
    id: string, 
    payment: {
      amount: number;
      date: Date;
      description?: string;
      method?: string;
    }
  ): Promise<boolean> {
    try {
      const result = await LegacyClient.findByIdAndUpdate(
        id,
        { 
          $push: { 
            paymentHistory: {
              ...payment,
              _id: new Date().getTime().toString() // ID simples para o pagamento
            }
          }
        },
        { new: true }
      );
      return !!result;
    } catch (error) {
      console.error("Erro ao adicionar pagamento:", error);
      return false;
    }
  }

  /**
   * Busca cliente por email
   */
  async findByEmail(email: string): Promise<ILegacyClient | null> {
    try {
      const client = await LegacyClient.findOne({ 
        email: { $regex: `^${email}$`, $options: 'i' } 
      });
      return client ? this.convertToInterface(client) : null;
    } catch (error) {
      console.error("Erro ao buscar cliente por email:", error);
      throw error;
    }
  }

  /**
   * Busca clientes por nome (busca textual)
   */
  async searchByName(
    name: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResult<ILegacyClient>> {
    try {
      const skip = (page - 1) * limit;
      const query = { 
        name: { $regex: name, $options: 'i' } 
      };
      
      const [docs, total] = await Promise.all([
        LegacyClient.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ name: 1 }),
        LegacyClient.countDocuments(query)
      ]);

      return {
        items: docs.map(doc => this.convertToInterface(doc)),
        total,
        page,
        limit
      };
    } catch (error) {
      console.error("Erro ao buscar clientes por nome:", error);
      throw error;
    }
  }

  /**
   * Estatísticas de clientes
   */
  async getClientStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDebts: number;
    totalDebt: number;
    averageDebt: number;
  }> {
    try {
      const [
        total,
        active,
        inactive,
        withDebts,
        debtStats
      ] = await Promise.all([
        LegacyClient.countDocuments(),
        LegacyClient.countDocuments({ status: 'active' }),
        LegacyClient.countDocuments({ status: 'inactive' }),
        LegacyClient.countDocuments({ totalDebt: { $gt: 0 } }),
        LegacyClient.aggregate([
          { $match: { totalDebt: { $gt: 0 } } },
          {
            $group: {
              _id: null,
              totalDebt: { $sum: '$totalDebt' },
              averageDebt: { $avg: '$totalDebt' }
            }
          }
        ])
      ]);

      const totalDebt = debtStats[0]?.totalDebt || 0;
      const averageDebt = debtStats[0]?.averageDebt || 0;

      return {
        total,
        active,
        inactive,
        withDebts,
        totalDebt,
        averageDebt
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas de clientes:", error);
      throw error;
    }
  }

  /**
   * Busca clientes por faixa de dívida
   */
  async findByDebtRange(
    minDebt: number, 
    maxDebt: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResult<ILegacyClient>> {
    try {
      const skip = (page - 1) * limit;
      const query = { 
        totalDebt: { $gte: minDebt, $lte: maxDebt } 
      };
      
      const [docs, total] = await Promise.all([
        LegacyClient.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ totalDebt: -1 }),
        LegacyClient.countDocuments(query)
      ]);

      return {
        items: docs.map(doc => this.convertToInterface(doc)),
        total,
        page,
        limit
      };
    } catch (error) {
      console.error("Erro ao buscar clientes por faixa de dívida:", error);
      throw error;
    }
  }

  /**
   * Verifica se documento já existe (para validação)
   */
  async documentExists(cpf: string, excludeId?: string): Promise<boolean> {
    try {
      const cleanDocument = cpf.replace(/\D/g, "");
      const query: any = { 
        cpf: { $in: [cpf, cleanDocument] } 
      };
      
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      
      const count = await LegacyClient.countDocuments(query);
      return count > 0;
    } catch (error) {
      console.error("Erro ao verificar se documento existe:", error);
      return false;
    }
  }

  /**
   * Busca clientes sem dívidas
   */
  async findClientsWithoutDebt(
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResult<ILegacyClient>> {
    try {
      const skip = (page - 1) * limit;
      const query = { 
        $or: [
          { totalDebt: { $eq: 0 } },
          { totalDebt: { $exists: false } }
        ]
      };
      
      const [docs, total] = await Promise.all([
        LegacyClient.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ name: 1 }),
        LegacyClient.countDocuments(query)
      ]);

      return {
        items: docs.map(doc => this.convertToInterface(doc)),
        total,
        page,
        limit
      };
    } catch (error) {
      console.error("Erro ao buscar clientes sem dívidas:", error);
      throw error;
    }
  }
} 