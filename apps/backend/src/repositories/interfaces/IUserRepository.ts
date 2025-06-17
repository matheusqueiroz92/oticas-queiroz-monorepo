import { IBaseRepository } from "./IBaseRepository";
import type { IUser } from "../../interfaces/IUser";

/**
 * Interface específica para UserRepository
 * Estende operações base com métodos especializados para usuários
 */
export interface IUserRepository extends IBaseRepository<IUser> {
  /**
   * Busca usuário por email
   * @param email Email do usuário
   * @returns Usuário encontrado ou null
   */
  findByEmail(email: string): Promise<IUser | null>;

  /**
   * Busca usuário por CPF
   * @param cpf CPF do usuário
   * @returns Usuário encontrado ou null
   */
  findByCpf(cpf: string): Promise<IUser | null>;

  /**
   * Busca usuário por CNPJ
   * @param cnpj CNPJ do usuário
   * @returns Usuário encontrado ou null
   */
  findByCnpj(cnpj: string): Promise<IUser | null>;

  /**
   * Busca usuário por número de ordem de serviço
   * @param serviceOrder Número da ordem de serviço
   * @returns Usuário encontrado ou null
   */
  findByServiceOrder(serviceOrder: string): Promise<IUser | null>;

  /**
   * Verifica se email já existe
   * @param email Email para verificar
   * @param excludeId ID para excluir da verificação (útil para updates)
   * @returns true se existe, false caso contrário
   */
  emailExists(email: string, excludeId?: string): Promise<boolean>;

  /**
   * Verifica se CPF já existe
   * @param cpf CPF para verificar
   * @param excludeId ID para excluir da verificação
   * @returns true se existe, false caso contrário
   */
  cpfExists(cpf: string, excludeId?: string): Promise<boolean>;

  /**
   * Verifica se CNPJ já existe
   * @param cnpj CNPJ para verificar
   * @param excludeId ID para excluir da verificação
   * @returns true se existe, false caso contrário
   */
  cnpjExists(cnpj: string, excludeId?: string): Promise<boolean>;

  /**
   * Busca usuários por role
   * @param role Role dos usuários
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de usuários
   */
  findByRole(
    role: IUser["role"],
    page?: number,
    limit?: number
  ): Promise<{ items: IUser[]; total: number; page: number; limit: number }>;

  /**
   * Busca usuários por termo de pesquisa
   * @param searchTerm Termo para buscar em nome, email, CPF
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de usuários
   */
  search(
    searchTerm: string,
    page?: number,
    limit?: number
  ): Promise<{ items: IUser[]; total: number; page: number; limit: number }>;

  /**
   * Atualiza senha do usuário
   * @param id ID do usuário
   * @param hashedPassword Nova senha hasheada
   * @returns Usuário atualizado ou null
   */
  updatePassword(id: string, hashedPassword: string): Promise<IUser | null>;

  /**
   * Busca usuários deletados
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de usuários deletados
   */
  findDeleted(
    page?: number,
    limit?: number
  ): Promise<{ items: IUser[]; total: number; page: number; limit: number }>;
} 