import { IBaseRepository } from "./IBaseRepository";
import type { IProduct } from "../../interfaces/IProduct";

/**
 * Interface específica para ProductRepository
 * Estende operações base com métodos especializados para produtos
 */
export interface IProductRepository extends IBaseRepository<IProduct, Omit<IProduct, '_id'>> {
  /**
   * Busca produtos por tipo
   * @param productType Tipo do produto
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de produtos
   */
  findByType(
    productType: IProduct["productType"],
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;

  /**
   * Busca produtos por marca
   * @param brand Marca do produto
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de produtos
   */
  findByBrand(
    brand: string,
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;

  /**
   * Busca produtos por termo de pesquisa
   * @param searchTerm Termo para buscar em nome e descrição
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de produtos
   */
  search(
    searchTerm: string,
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;

  /**
   * Busca produtos com estoque baixo
   * @param threshold Limite mínimo de estoque
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de produtos
   */
  findLowStock(
    threshold?: number,
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;

  /**
   * Busca produtos sem estoque
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de produtos
   */
  findOutOfStock(
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;

  /**
   * Busca produtos por faixa de preço
   * @param minPrice Preço mínimo
   * @param maxPrice Preço máximo
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de produtos
   */
  findByPriceRange(
    minPrice: number,
    maxPrice: number,
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;

  /**
   * Busca produtos de lentes por tipo
   * @param lensType Tipo da lente
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de lentes
   */
  findLensesByType(
    lensType: string,
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;

  /**
   * Busca armações por características
   * @param filters Filtros específicos de armações
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de armações
   */
  findFramesByFilters(
    filters: {
      typeFrame?: string;
      color?: string;
      shape?: string;
      reference?: string;
      modelSunglasses?: string;
    },
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;

  /**
   * Aumenta estoque de um produto
   * @param id ID do produto
   * @param quantity Quantidade a adicionar
   * @returns Produto atualizado ou null
   */
  increaseStock(id: string, quantity: number): Promise<IProduct | null>;

  /**
   * Diminui estoque de um produto
   * @param id ID do produto
   * @param quantity Quantidade a remover
   * @returns Produto atualizado ou null
   */
  decreaseStock(id: string, quantity: number): Promise<IProduct | null>;

  /**
   * Atualiza preço de venda de um produto
   * @param id ID do produto
   * @param sellPrice Novo preço de venda
   * @returns Produto atualizado ou null
   */
  updateSellPrice(id: string, sellPrice: number): Promise<IProduct | null>;

  /**
   * Atualiza preço de custo de um produto
   * @param id ID do produto
   * @param costPrice Novo preço de custo
   * @returns Produto atualizado ou null
   */
  updateCostPrice(id: string, costPrice: number): Promise<IProduct | null>;

  /**
   * Busca produtos mais vendidos
   * @param startDate Data inicial
   * @param endDate Data final
   * @param limit Limite de resultados
   * @returns Lista de produtos mais vendidos
   */
  findBestSelling(
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<Array<{ product: IProduct; totalSold: number }>>;

  /**
   * Busca produtos deletados
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de produtos deletados
   */
  findDeleted(
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;

  /**
   * Calcula valor total do estoque
   * @param productType Tipo específico (opcional)
   * @returns Valor total do estoque
   */
  calculateStockValue(productType?: IProduct["productType"]): Promise<number>;

  /**
   * Busca estatísticas de produtos
   * @returns Estatísticas gerais dos produtos
   */
  getProductStats(): Promise<{
    totalProducts: number;
    productsByType: Record<IProduct["productType"], number>;
    totalStockValue: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  }>;

  /**
   * Busca produtos com filtros avançados
   * @param filters Filtros complexos
   * @param page Página
   * @param limit Limite por página
   * @returns Lista paginada de produtos
   */
  findWithFilters(
    filters: Record<string, any>,
    page?: number,
    limit?: number
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }>;
} 