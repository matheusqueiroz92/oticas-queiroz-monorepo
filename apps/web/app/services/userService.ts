import { api } from "./authService";
import type { User } from "../types/user";
import { API_ROUTES } from "../constants/api-routes";

export interface UserFilters {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
  sort?: string;
  cpf?: string;
  cnpj?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Busca todos os usuários com suporte a paginação, filtragem e ordenação
 */
export async function getAllUsers(filters: UserFilters = {}): Promise<{
  users: User[];
  pagination?: PaginationInfo;
}> {
  try {
    const params: Record<string, any> = {};

    // Sempre inclua parâmetros de paginação
    params.page = filters.page || 1;
    params.limit = filters.limit || 10;
    params.sort = filters.sort || "name";
    
    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.cpf) {
      params.cpf = filters.cpf;
    }
    
    if (filters.role && filters.role !== 'all') {
      params.role = filters.role;
    }
    
    // Adicionar timestamp para evitar cache
    params._t = Date.now() + Math.random().toString(36).substring(7);

    const config = {
      params,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Force-Fetch': 'true',
        'X-Timestamp': Date.now().toString()
      }
    };
    
    const response = await api.get(API_ROUTES.USERS.BASE, config);

    let allUsers: User[] = [];
    let pagination: PaginationInfo = {
      page: params.page,
      limit: params.limit,
      total: 0,
      totalPages: 1
    };

    // Extrair todos os usuários da resposta
    if (Array.isArray(response.data)) {
      allUsers = response.data;
      pagination.total = response.data.length;
      pagination.totalPages = Math.ceil(response.data.length / params.limit);
    } else if (response.data?.users && Array.isArray(response.data.users)) {
      allUsers = response.data.users;
      
      // Se a API retornar informações de paginação, use-as
      if (response.data.pagination) {
        pagination = response.data.pagination;
      } else {
        pagination.total = response.data.users.length;
        pagination.totalPages = Math.ceil(response.data.users.length / params.limit);
      }
    } else if (typeof response.data === 'object') {
      // Tente extrair um array de usuários do objeto
      const possibleUserArrays = Object.values(response.data).filter(
        value => Array.isArray(value)
      ) as any[][];
      
      if (possibleUserArrays.length > 0) {
        allUsers = possibleUserArrays[0];
        pagination.total = allUsers.length;
        pagination.totalPages = Math.ceil(allUsers.length / params.limit);
      }
    }

    // Sempre garanta valores mínimos para a paginação
    pagination.page = Math.max(1, pagination.page);
    pagination.totalPages = Math.max(1, pagination.totalPages);
    
    // IMPORTANTE: Aplicar a paginação manualmente se o backend não fornecer dados paginados
    // Isso garante que apenas os itens da página atual sejam retornados
    let paginatedUsers = allUsers;
    
    // Se o backend retornou todos os usuários (não paginados), fazemos a paginação manualmente
    if (allUsers.length > params.limit && !response.data.pagination) {
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      paginatedUsers = allUsers.slice(startIndex, endIndex);
    }

    return { users: paginatedUsers, pagination };
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    // Retornar estrutura básica mesmo em caso de erro
    return { 
      users: [], 
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
      }
    };
  }
}

/**
 * Busca um usuário específico pelo ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const response = await api.get(API_ROUTES.USERS.BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar usuário com ID ${id}:`, error);
    return null;
  }
}

/**
 * Busca todos os clientes
 */
export async function getCustomers(filters: UserFilters = {}): Promise<{
  users: User[];
  pagination?: PaginationInfo;
}> {
  const customerFilters = {
    ...filters,
    role: 'customer'
  };
  
  return getAllUsers(customerFilters);
}

/**
 * Busca todos os funcionários
 */
export async function getEmployees(filters: UserFilters = {}): Promise<{
  users: User[];
  pagination?: PaginationInfo;
}> {
  const employeeFilters = {
    ...filters,
    role: 'employee'
  };
  
  return getAllUsers(employeeFilters);
}

/**
 * Cria um novo usuário
 */
export async function createUser(userData: FormData): Promise<User | null> {
  try {
    const response = await api.post(API_ROUTES.AUTH.REGISTER, userData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
}

/**
 * Atualiza um usuário existente
 */
export async function updateUser(id: string, userData: FormData): Promise<User | null> {
  try {
    const response = await api.put(API_ROUTES.USERS.BY_ID(id), userData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar usuário com ID ${id}:`, error);
    throw error;
  }
}

/**
 * Deleta um usuário
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    await api.delete(API_ROUTES.USERS.BY_ID(id));
    return true;
  } catch (error) {
    console.error(`Erro ao deletar usuário com ID ${id}:`, error);
    throw error;
  }
}

/**
 * Busca todos os usuários para exportação, aplicando filtros opcionais
 */
export const getAllUsersForExport = async (filters: Record<string, any> = {}): Promise<User[]> => {
  try {
    const params = new URLSearchParams();
    
    params.append('limit', '9999');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key !== 'page' && key !== 'limit') {
          params.append(key, String(value));
        }
      }
    });
    
    const response = await api.get(`${API_ROUTES.USERS.BASE}?${params.toString()}`);
    
    let result = [];
    
    if (Array.isArray(response.data)) {
      result = response.data;
    } else if (response.data?.users && Array.isArray(response.data.users)) {
      result = response.data.users;
    } else {
      console.warn('Formato de resposta inesperado na exportação:', response.data);
      result = [];
    }

    return result;
  } catch (error) {
    console.error('Erro ao buscar usuários para exportação:', error);
    throw error;
  }
};