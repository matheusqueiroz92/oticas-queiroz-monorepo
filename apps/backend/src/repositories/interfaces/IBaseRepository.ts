/**
 * Interface base para todos os repositories
 * Define operações CRUD comuns
 */
export interface IBaseRepository<T, CreateDTO = Omit<T, '_id'>> {
  /**
   * Cria um novo documento
   * @param data Dados para criação
   * @returns Documento criado
   */
  create(data: CreateDTO): Promise<T>;

  /**
   * Busca um documento por ID
   * @param id ID do documento
   * @returns Documento encontrado ou null
   */
  findById(id: string): Promise<T | null>;

  /**
   * Busca todos os documentos com paginação
   * @param page Página
   * @param limit Limite por página
   * @param filters Filtros de busca
   * @returns Lista paginada de documentos
   */
  findAll(
    page?: number,
    limit?: number,
    filters?: Record<string, any>
  ): Promise<{ items: T[]; total: number; page: number; limit: number }>;

  /**
   * Atualiza um documento
   * @param id ID do documento
   * @param data Dados para atualização
   * @returns Documento atualizado ou null
   */
  update(id: string, data: Partial<T>): Promise<T | null>;

  /**
   * Remove um documento
   * @param id ID do documento
   * @returns Documento removido ou null
   */
  delete(id: string): Promise<T | null>;

  /**
   * Soft delete de um documento
   * @param id ID do documento
   * @param deletedBy ID do usuário que deletou
   * @returns Documento deletado ou null
   */
  softDelete(id: string, deletedBy: string): Promise<T | null>;

  /**
   * Verifica se um documento existe
   * @param id ID do documento
   * @returns true se existe, false caso contrário
   */
  exists(id: string): Promise<boolean>;

  /**
   * Conta documentos que atendem aos filtros
   * @param filters Filtros de busca
   * @returns Número de documentos
   */
  count(filters?: Record<string, any>): Promise<number>;
} 