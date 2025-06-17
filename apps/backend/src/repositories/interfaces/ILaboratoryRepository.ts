import { IBaseRepository } from "./IBaseRepository";
import type { ILaboratory } from "../../interfaces/ILaboratory";

/**
 * Interface específica para LaboratoryRepository
 * Estende operações base com métodos especializados para laboratórios
 */
export interface ILaboratoryRepository extends IBaseRepository<ILaboratory, Omit<ILaboratory, '_id'>> {
  /**
   * Busca laboratório por email
   * @param email Email do laboratório
   * @returns Laboratório encontrado ou null
   */
  findByEmail(email: string): Promise<ILaboratory | null>;

  /**
   * Busca laboratórios ativos
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de laboratórios ativos
   */
  findActive(
    page?: number,
    limit?: number
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }>;

  /**
   * Busca laboratórios inativos
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de laboratórios inativos
   */
  findInactive(
    page?: number,
    limit?: number
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }>;

  /**
   * Busca laboratórios por cidade
   * @param city Cidade
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de laboratórios
   */
  findByCity(
    city: string,
    page?: number,
    limit?: number
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }>;

  /**
   * Busca laboratórios por estado
   * @param state Estado
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de laboratórios
   */
  findByState(
    state: string,
    page?: number,
    limit?: number
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }>;

  /**
   * Pesquisa laboratórios por termo
   * @param searchTerm Termo para buscar em nome, email ou contactName
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de laboratórios
   */
  search(
    searchTerm: string,
    page?: number,
    limit?: number
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }>;

  /**
   * Alterna status ativo/inativo do laboratório
   * @param id ID do laboratório
   * @returns Laboratório atualizado ou null
   */
  toggleActive(id: string): Promise<ILaboratory | null>;

  /**
   * Verifica se email já existe
   * @param email Email a verificar
   * @param excludeId ID a excluir da verificação (para updates)
   * @returns true se email existe
   */
  emailExists(email: string, excludeId?: string): Promise<boolean>;

  /**
   * Busca laboratórios por nome da pessoa de contato
   * @param contactName Nome do contato
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de laboratórios
   */
  findByContactName(
    contactName: string,
    page?: number,
    limit?: number
  ): Promise<{ items: ILaboratory[]; total: number; page: number; limit: number }>;
} 