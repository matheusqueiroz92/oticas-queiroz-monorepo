import mongoose, { Model, Document, Types } from "mongoose";
import { IBaseRepository } from "../interfaces/IBaseRepository";

/**
 * Classe base abstrata para implementações de repositories
 * Fornece implementações padrão para operações CRUD comuns
 */
export abstract class BaseRepository<T, CreateDTO = Omit<T, '_id'>> 
  implements IBaseRepository<T, CreateDTO> {
  
  protected model: Model<any>;

  constructor(model: Model<any>) {
    this.model = model;
  }

  /**
   * Converte documento do MongoDB para o tipo da interface
   */
  protected abstract convertToInterface(doc: any): T;

  /**
   * Valida se um ID é válido do MongoDB
   */
  protected isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  /**
   * Cria um novo documento
   */
  async create(data: CreateDTO): Promise<T> {
    try {
      const doc = await this.model.create(data);
      return this.convertToInterface(doc);
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      throw error;
    }
  }

  /**
   * Busca um documento por ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findById(id).exec();
      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao buscar documento por ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Busca todos os documentos com paginação
   */
  async findAll(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {},
    includeDeleted = false,
    sortOptions?: Record<string, 1 | -1>
  ): Promise<{ items: T[]; total: number; page: number; limit: number }> {
      const skip = (page - 1) * limit;
      
    // Construir query baseada nos filtros
      const query = this.buildFilterQuery(filters);
      
    // Adicionar filtro de exclusão de deletados (se não especificado para incluir)
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    // Adicionar opções de ordenação se fornecidas
    if (sortOptions) {
      // sortOptions já está no formato correto para o Mongoose
    } else if (filters.sort) {
      // Manter compatibilidade com sistema de ordenação existente
      const sortField = filters.sort.startsWith('-') 
        ? filters.sort.substring(1) 
        : filters.sort;
      const sortOrder = filters.sort.startsWith('-') ? -1 : 1;
      sortOptions = { [sortField]: sortOrder };
    } else {
      // Ordenação padrão
      sortOptions = { createdAt: -1 };
    }

    const docs = await this.model
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.model.countDocuments(query);

      return {
      items: docs as T[],
        total,
        page,
      limit,
      };
  }

  /**
   * Atualiza um documento
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao atualizar documento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove um documento
   */
  async delete(id: string): Promise<T | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findByIdAndDelete(id).exec();
      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao deletar documento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete de um documento
   */
  async softDelete(id: string, deletedBy: string): Promise<T | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findByIdAndUpdate(
        id,
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: new Types.ObjectId(deletedBy)
          }
        },
        { new: true, runValidators: true }
      ).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao fazer soft delete do documento ${id}:`, error);
      throw error;
    }
  }

  /**
   * Verifica se um documento existe
   */
  async exists(id: string): Promise<boolean> {
    try {
      if (!this.isValidId(id)) {
        return false;
      }

      const doc = await this.model.findById(id).select('_id').exec();
      return !!doc;
    } catch (error) {
      console.error(`Erro ao verificar existência do documento ${id}:`, error);
      return false;
    }
  }

  /**
   * Conta documentos que atendem aos filtros
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    try {
      const query = this.buildFilterQuery(filters);
      return await this.model.countDocuments(query).exec();
    } catch (error) {
      console.error('Erro ao contar documentos:', error);
      throw error;
    }
  }

  /**
   * Constrói query de filtros - deve ser sobrescrito por classes filhas
   */
  protected buildFilterQuery(filters: Record<string, any>): Record<string, any> {
    const query: Record<string, any> = {};

    // Remover filtros internos que não devem fazer parte da query
    const { includeDeleted, sort, searchTerm, page, limit, _t, startDate, endDate, ...remainingFilters } = filters;

    // Adicionar filtros restantes
    Object.keys(remainingFilters).forEach(key => {
      if (remainingFilters[key] !== undefined && remainingFilters[key] !== null) {
        query[key] = remainingFilters[key];
      }
    });

    return query;
  }

  /**
   * Busca documentos com session do MongoDB (para transações)
   */
  protected async findWithSession(
    query: Record<string, any>,
    session?: mongoose.ClientSession
  ): Promise<T[]> {
    try {
      const docs = session 
        ? await this.model.find(query).session(session).exec()
        : await this.model.find(query).exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error('Erro ao buscar documentos com session:', error);
      throw error;
    }
  }

  /**
   * Cria documento com session do MongoDB (para transações)
   */
  protected async createWithSession(
    data: CreateDTO,
    session?: mongoose.ClientSession
  ): Promise<T> {
    try {
      const docs = session
        ? await this.model.create([data], { session })
        : await this.model.create(data);

      const doc = Array.isArray(docs) ? docs[0] : docs;
      return this.convertToInterface(doc);
    } catch (error) {
      console.error('Erro ao criar documento com session:', error);
      throw error;
    }
  }
} 