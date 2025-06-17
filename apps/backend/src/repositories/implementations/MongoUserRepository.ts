import { User } from "../../schemas/UserSchema";
import { BaseRepository } from "./BaseRepository";
import { IUserRepository } from "../interfaces/IUserRepository";
import type { IUser } from "../../interfaces/IUser";
import { Types } from "mongoose";

/**
 * Implementação do UserRepository para MongoDB
 */
export class MongoUserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(User);
  }

  /**
   * Converte documento do MongoDB para IUser
   */
  protected convertToInterface(doc: any): IUser {
    if (!doc) {
      throw new Error("Documento não pode ser nulo");
    }

    const user = doc.toObject ? doc.toObject() : doc;

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
      comparePassword: doc.comparePassword ? doc.comparePassword.bind(doc) : undefined // Preservar método do documento original
    };
  }

  /**
   * Constrói query de filtros específica para usuários
   */
  protected buildFilterQuery(filters: Record<string, any>): Record<string, any> {
    console.log('🔍 MongoUserRepository.buildFilterQuery - Filtros recebidos:', filters);
    
    const query = super.buildFilterQuery(filters);
    console.log('🔍 MongoUserRepository.buildFilterQuery - Query base:', query);

    // Filtros específicos para usuários
    if (filters.role) {
      query.role = filters.role;
      console.log('🔍 MongoUserRepository.buildFilterQuery - Adicionado role:', filters.role);
    }

    if (filters.searchTerm) {
      console.log('🔍 MongoUserRepository.buildFilterQuery - Processando searchTerm:', filters.searchTerm);
      
      // Verificar se o termo é numérico (para CPF/CNPJ)
      const isNumeric = /^\d+$/.test(filters.searchTerm);
      
      if (isNumeric) {
        // Se for numérico, buscar apenas em CPF/CNPJ
        query.$or = [
          { cpf: { $regex: filters.searchTerm, $options: 'i' } },
          { cnpj: { $regex: filters.searchTerm, $options: 'i' } }
        ];
      } else {
        // Se for texto, buscar apenas no nome
        query.name = { $regex: filters.searchTerm, $options: 'i' };
      }
      
      console.log('🔍 MongoUserRepository.buildFilterQuery - Query $or criada:', JSON.stringify(query.$or, null, 2));
    }

    console.log('🔍 MongoUserRepository.buildFilterQuery - Query final:', JSON.stringify(query, null, 2));
    return query;
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