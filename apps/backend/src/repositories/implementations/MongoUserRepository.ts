import { User } from "../../schemas/UserSchema";
import { BaseRepository } from "./BaseRepository";
import { IUserRepository } from "../interfaces/IUserRepository";
import type { IUser } from "../../interfaces/IUser";
import { Types } from "mongoose";
import { UserModel } from "../../models/UserModel";

/**
 * Implementação do UserRepository para MongoDB
 */
export class MongoUserRepository extends BaseRepository<IUser> implements IUserRepository {
  private userModel: UserModel;

  constructor() {
    super(User);
    this.userModel = new UserModel();
  }

  /**
   * Converte documento do MongoDB para IUser
   */
  protected convertToInterface(doc: any): IUser & { customerCategory?: string } {
    if (!doc) {
      throw new Error("Documento não pode ser nulo");
    }

    const user = doc.toObject ? doc.toObject() : doc;
    const purchasesCount = Array.isArray(user.purchases) ? user.purchases.length : 0;
    let customerCategory = 'novo';
    if (purchasesCount >= 5) customerCategory = 'vip';
    else if (purchasesCount >= 1 && purchasesCount <= 4) customerCategory = 'regular';

    return {
      _id: user._id?.toString(),
      name: user.name || "",
      email: user.email,
      cpf: user.cpf,
      cnpj: user.cnpj,
      rg: user.rg,
      password: user.password || "",
      role: user.role || "customer",
      phone: user.phone,
      birthDate: user.birthDate,
      address: user.address,
      purchases: Array.isArray(user.purchases) 
        ? user.purchases.map((id: any) => id.toString())
        : [],
      debts: user.debts || 0,
      sales: Array.isArray(user.sales)
        ? user.sales.map((id: any) => id.toString())
        : [],
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      comparePassword: doc.comparePassword ? doc.comparePassword.bind(doc) : undefined,
      customerCategory
    };
  }

  /**
   * Constrói query de filtros específica para usuários
   */
  protected buildFilterQuery(filters: Record<string, any>): Record<string, any> {
    const baseQuery = super.buildFilterQuery(filters);
    const andFilters: any[] = [];

    // Filtros específicos para usuários
    if (filters.role) {
      baseQuery.role = filters.role;
    }

    if (filters.searchTerm) {
      const isNumeric = /^\d+$/.test(filters.searchTerm);
      if (isNumeric) {
        andFilters.push({
          $or: [
            { cpf: { $regex: filters.searchTerm, $options: 'i' } },
            { cnpj: { $regex: filters.searchTerm, $options: 'i' } }
          ]
        });
      } else {
        andFilters.push({ name: { $regex: filters.searchTerm, $options: 'i' } });
      }
    }

    // Filtro por faixa de compras
    if (filters.purchaseRange && filters.purchaseRange !== 'all') {
      const purchaseRanges = Array.isArray(filters.purchaseRange)
        ? filters.purchaseRange
        : [filters.purchaseRange];
      
      const orFilters = purchaseRanges.map((range) => {
        if (range === '0') {
          return { $expr: { $eq: [ { $size: "$purchases" }, 0 ] } };
        } else if (range === '1-2') {
          return { $expr: { $in: [ { $size: "$purchases" }, [1,2] ] } };
        } else if (range === '3-4') {
          return { $expr: { $in: [ { $size: "$purchases" }, [3,4] ] } };
        } else if (range === '5+') {
          return { $expr: { $gte: [ { $size: "$purchases" }, 5 ] } };
        }
        return null;
      }).filter(Boolean);
      if (orFilters.length > 0) {
        andFilters.push({ $or: orFilters });
      }
    }

    // Filtro por data de cadastro
    if (filters.startDate || filters.endDate) {
      const createdAt: any = {};
      if (filters.startDate) {
        // Sempre usar início do dia em UTC
        const start = new Date(filters.startDate + 'T00:00:00.000Z');
        createdAt.$gte = start;
      }
      if (filters.endDate) {
        // Sempre usar fim do dia em UTC
        const end = new Date(filters.endDate + 'T23:59:59.999Z');
        createdAt.$lte = end;
      }
      andFilters.push({ createdAt });
    }

    // Filtro por clientes com débitos
    if (filters.hasDebts === 'true') {
      andFilters.push({ debts: { $gt: 0 } });
    }

    // Combinar todos os filtros
    const finalQuery = { ...baseQuery };
    if (andFilters.length > 0) {
      finalQuery.$and = andFilters;
    }
    // Remover campos auxiliares que não existem no banco
    delete finalQuery.purchaseRange;
    delete finalQuery.page;
    delete finalQuery.limit;
    delete finalQuery._t;
    delete finalQuery.hasDebts;

    return finalQuery;
  }

  /**
   * Cria um novo usuário no banco de dados
   */
  async create(data: Omit<IUser, "_id">): Promise<IUser> {
    try {
      return await this.userModel.create(data);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  /**
   * Busca todos os usuários
   */
  async findAll(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {},
    includeDeleted = false,
    sortOptions?: Record<string, 1 | -1>
  ): Promise<{ items: IUser[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const query = this.buildFilterQuery(filters);

    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    if (!sortOptions) {
      sortOptions = { createdAt: -1 };
    }

    const docs = await this.model
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.model.countDocuments(query);

    return {
      items: docs.map((doc: any) => this.convertToInterface(doc)),
      total,
      page,
      limit,
    };
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const doc = await this.model.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
        isDeleted: { $ne: true }
      }).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao buscar usuário por email ${email}:`, error);
      return null;
    }
  }

  /**
   * Busca usuário por CPF
   */
  async findByCpf(cpf: string): Promise<IUser | null> {
    try {
      const sanitizedCpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
      const doc = await this.model.findOne({
        cpf: sanitizedCpf,
        isDeleted: { $ne: true }
      }).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao buscar usuário por CPF ${cpf}:`, error);
      return null;
    }
  }

  /**
   * Busca usuário por CNPJ
   */
  async findByCnpj(cnpj: string): Promise<IUser | null> {
    try {
      const sanitizedCnpj = cnpj.replace(/\D/g, ''); // Remove caracteres não numéricos
      const doc = await this.model.findOne({
        cnpj: sanitizedCnpj,
        isDeleted: { $ne: true }
      }).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao buscar usuário por CNPJ ${cnpj}:`, error);
      return null;
    }
  }

  /**
   * Busca usuários por role
   */
  async findByRole(
    role: IUser["role"],
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IUser[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { role });
  }

  /**
   * Busca usuário por número de ordem de serviço
   */
  async findByServiceOrder(serviceOrder: string): Promise<IUser | null> {
    try {
      // Importar dinamicamente para evitar dependência circular
      const { OrderModel } = require('../../models/OrderModel');
      
      const order = await OrderModel.findOne({ 
        serviceOrder, 
        isDeleted: { $ne: true } 
      }).populate('clientId').exec();
      
      if (order && order.clientId) {
        return this.convertToInterface(order.clientId);
      }
      return null;
    } catch (error) {
      console.error(`Erro ao buscar usuário por ordem de serviço ${serviceOrder}:`, error);
      return null;
    }
  }

  /**
   * Verifica se email já existe
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const query: any = {
        email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
        isDeleted: { $ne: true }
      };

      if (excludeId && this.isValidId(excludeId)) {
        query._id = { $ne: new Types.ObjectId(excludeId) };
      }

      const doc = await this.model.findOne(query).select('_id').exec();
      return !!doc;
    } catch (error) {
      console.error(`Erro ao verificar existência do email ${email}:`, error);
      return false;
    }
  }

  /**
   * Verifica se CPF já existe
   */
  async cpfExists(cpf: string, excludeId?: string): Promise<boolean> {
    try {
      const sanitizedCpf = cpf.replace(/\D/g, '');
      const query: any = {
        cpf: sanitizedCpf,
        isDeleted: { $ne: true }
      };

      if (excludeId && this.isValidId(excludeId)) {
        query._id = { $ne: new Types.ObjectId(excludeId) };
      }

      const doc = await this.model.findOne(query).select('_id').exec();
      return !!doc;
    } catch (error) {
      console.error(`Erro ao verificar existência do CPF ${cpf}:`, error);
      return false;
    }
  }

  /**
   * Verifica se CNPJ já existe
   */
  async cnpjExists(cnpj: string, excludeId?: string): Promise<boolean> {
    try {
      const sanitizedCnpj = cnpj.replace(/\D/g, '');
      const query: any = {
        cnpj: sanitizedCnpj,
        isDeleted: { $ne: true }
      };

      if (excludeId && this.isValidId(excludeId)) {
        query._id = { $ne: new Types.ObjectId(excludeId) };
      }

      const doc = await this.model.findOne(query).select('_id').exec();
      return !!doc;
    } catch (error) {
      console.error(`Erro ao verificar existência do CNPJ ${cnpj}:`, error);
      return false;
    }
  }

  /**
   * Busca usuários por termo de pesquisa
   */
  async search(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IUser[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { searchTerm });
  }

  /**
   * Atualiza senha do usuário
   */
  async updatePassword(id: string, hashedPassword: string): Promise<IUser | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findByIdAndUpdate(
        id,
        { $set: { password: hashedPassword } },
        { new: true, runValidators: true }
      ).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao atualizar senha do usuário ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca usuários deletados
   */
  async findDeleted(
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IUser[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { includeDeleted: true, isDeleted: true });
  }
} 