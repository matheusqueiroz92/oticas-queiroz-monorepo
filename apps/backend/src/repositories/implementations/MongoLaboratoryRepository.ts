import { BaseRepository } from "./BaseRepository";
import { Laboratory } from "../../schemas/LaboratorySchema";
import type { ILaboratory } from "../../interfaces/ILaboratory";
import type { ILaboratoryRepository } from "../interfaces/ILaboratoryRepository";

/**
 * Implementação MongoDB do LaboratoryRepository
 * Fornece acesso a dados de laboratórios com operações especializadas
 */
export class MongoLaboratoryRepository extends BaseRepository<ILaboratory, Omit<ILaboratory, "_id">> implements ILaboratoryRepository {
  
  constructor() {
    super(Laboratory);
  }

  /**
   * Converte documento MongoDB para interface ILaboratory
   */
  protected convertToInterface(doc: any): ILaboratory {
    if (!doc) return doc;

    return {
      _id: doc._id?.toString(),
      name: doc.name,
      address: {
        street: doc.address?.street || "",
        number: doc.address?.number || "",
        complement: doc.address?.complement,
        neighborhood: doc.address?.neighborhood || "",
        city: doc.address?.city || "",
        state: doc.address?.state || "",
        zipCode: doc.address?.zipCode || ""
      },
      phone: doc.phone,
      email: doc.email,
      contactName: doc.contactName,
      isActive: doc.isActive ?? true,
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
    if (filters.name) {
      query.name = new RegExp(filters.name, 'i');
    }

    if (filters.email) {
      query.email = new RegExp(filters.email, 'i');
    }

    if (filters.contactName) {
      query.contactName = new RegExp(filters.contactName, 'i');
    }

    if (typeof filters.isActive === 'boolean') {
      query.isActive = filters.isActive;
    }

    // Filtros de endereço
    if (filters.city) {
      query['address.city'] = new RegExp(filters.city, 'i');
    }

    if (filters.state) {
      query['address.state'] = new RegExp(filters.state, 'i');
    }

    if (filters.neighborhood) {
      query['address.neighborhood'] = new RegExp(filters.neighborhood, 'i');
    }

    if (filters.zipCode) {
      query['address.zipCode'] = filters.zipCode.replace(/\D/g, '');
    }

    // Filtros de telefone
    if (filters.phone) {
      query.phone = new RegExp(filters.phone.replace(/\D/g, ''), 'i');
    }

    // Soft delete
    if (!filters.includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    return query;
  }

  /**
   * Busca laboratório por email
   */
  async findByEmail(email: string): Promise<ILaboratory | null> {
    try {
      const doc = await this.model.findOne({ 
        email: email.toLowerCase(),
        isDeleted: { $ne: true }
      }).exec();

      return doc ? this.convertToInterface(doc) : null;
    } catch (error) {
      console.error('Erro ao buscar laboratório por email:', error);
      throw error;
    }
  }

  /**
   * Busca laboratórios ativos
   */
  async findActive(
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { isActive: true });
  }

  /**
   * Busca laboratórios inativos
   */
  async findInactive(
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { isActive: false });
  }

  /**
   * Busca laboratórios por cidade
   */
  async findByCity(
    city: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { city });
  }

  /**
   * Busca laboratórios por estado
   */
  async findByState(
    state: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { state });
  }

  /**
   * Pesquisa laboratórios por termo
   */
  async search(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      
      const query = {
        $or: [
          { name: new RegExp(searchTerm, 'i') },
          { email: new RegExp(searchTerm, 'i') },
          { contactName: new RegExp(searchTerm, 'i') },
          { 'address.city': new RegExp(searchTerm, 'i') },
          { 'address.state': new RegExp(searchTerm, 'i') }
        ],
        isDeleted: { $ne: true }
      };

      const [docs, total] = await Promise.all([
        this.model.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ name: 1 })
          .exec(),
        this.model.countDocuments(query).exec()
      ]);

      const items = docs.map(doc => this.convertToInterface(doc));

      return {
        items,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Erro ao pesquisar laboratórios:', error);
      throw error;
    }
  }

  /**
   * Alterna status ativo/inativo do laboratório
   */
  async toggleActive(id: string): Promise<ILaboratory | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const current = await this.model.findById(id).exec();
      if (!current || current.isDeleted) {
        return null;
      }

      const doc = await this.model.findByIdAndUpdate(
        id,
        { 
          $set: { 
            isActive: !current.isActive,
            updatedAt: new Date()
          }
        },
        { new: true, runValidators: true }
      ).exec();

      return doc ? this.convertToInterface(doc) : null;
    } catch (error) {
      console.error(`Erro ao alternar status do laboratório ${id}:`, error);
      throw error;
    }
  }

  /**
   * Verifica se email já existe
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      const query: any = { 
        email: email.toLowerCase(),
        isDeleted: { $ne: true }
      };

      if (excludeId && this.isValidId(excludeId)) {
        query._id = { $ne: excludeId };
      }

      const count = await this.model.countDocuments(query).exec();
      return count > 0;
    } catch (error) {
      console.error('Erro ao verificar email existente:', error);
      return false;
    }
  }

  /**
   * Busca laboratórios por nome da pessoa de contato
   */
  async findByContactName(
    contactName: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { contactName });
  }
} 