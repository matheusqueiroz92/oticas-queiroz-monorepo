import type { IBaseRepository } from "./IBaseRepository";
import type { ILegacyClient } from "../../interfaces/ILegacyClient";

// Tipo para resultado paginado
type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export interface ILegacyClientRepository extends IBaseRepository<ILegacyClient> {
  // Métodos especializados para LegacyClient
  findByDocument(cpf: string): Promise<ILegacyClient | null>;
  
  // Busca clientes com dívidas
  findDebtors(minDebt?: number, maxDebt?: number): Promise<ILegacyClient[]>;
  
  // Histórico de pagamentos
  getPaymentHistory(
    id: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<ILegacyClient["paymentHistory"]>;
  
  // Busca com filtros e paginação
  findAllWithFilters(
    filters: Partial<ILegacyClient>,
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<ILegacyClient>>;
  
  // Busca por status
  findByStatus(status: "active" | "inactive", page?: number, limit?: number): Promise<PaginatedResult<ILegacyClient>>;
  
  // Atualiza dívida total
  updateTotalDebt(id: string, totalDebt: number): Promise<boolean>;
  
  // Adiciona pagamento ao histórico
  addPayment(
    id: string, 
    payment: {
      amount: number;
      date: Date;
      description?: string;
      method?: string;
    }
  ): Promise<boolean>;
  
  // Busca clientes com email
  findByEmail(email: string): Promise<ILegacyClient | null>;
  
  // Busca clientes por nome (busca textual)
  searchByName(name: string, page?: number, limit?: number): Promise<PaginatedResult<ILegacyClient>>;
  
  // Estatísticas de clientes
  getClientStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDebts: number;
    totalDebt: number;
    averageDebt: number;
  }>;
  
  // Busca clientes por faixa de dívida
  findByDebtRange(
    minDebt: number, 
    maxDebt: number, 
    page?: number, 
    limit?: number
  ): Promise<PaginatedResult<ILegacyClient>>;
  
  // Verifica se documento já existe (para validação)
  documentExists(cpf: string, excludeId?: string): Promise<boolean>;
  
  // Busca clientes sem dívidas
  findClientsWithoutDebt(page?: number, limit?: number): Promise<PaginatedResult<ILegacyClient>>;
} 