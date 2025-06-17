import { getRepositories } from "../repositories/RepositoryFactory";
import { IProduct } from "../interfaces/IProduct";
import { z } from 'zod';
import { productSchema } from '../validators/productValidators';
import mongoose from "mongoose";

export class ProductError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductError";
  }
}

export class ProductService {
  private productRepository: any;

  constructor() {
    const { productRepository } = getRepositories();
    this.productRepository = productRepository;
  }

  private validateProduct(productData: IProduct): void {
    try {
      productSchema.parse(productData);
      
      if (
        (productData.productType === 'prescription_frame' || 
         productData.productType === 'sunglasses_frame') &&
        (productData as any).stock === undefined
      ) {
        (productData as any).stock = 0;
      }
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => e.message).join(', ');
        throw new ProductError(`Dados inválidos: ${errorMessage}`);
      }
      throw error;
    }
  }

  async createProduct(productData: IProduct): Promise<IProduct> {
    this.validateProduct(productData);

    // Verificar se já existe produto com o mesmo nome
    const searchResult = await this.productRepository.search(productData.name, 1, 1);
    if (searchResult.items.length > 0) {
      const existingProduct = searchResult.items.find((p: IProduct) => 
        p.name.toLowerCase() === productData.name.toLowerCase()
      );
      if (existingProduct) {
        throw new ProductError("Produto já cadastrado com este nome");
      }
    }

    return this.productRepository.create(productData);
  }

  async getAllProducts(
    page?: number,
    limit?: number,
    filters?: Record<string, any>
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productRepository.findAll(page || 1, limit || 10, filters);
    
    if (result.total === 0) {
      throw new ProductError("Nenhum produto encontrado");
    }
    
    return {
      products: result.items,
      total: result.total
    };
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await this.productRepository.findById(id);
    
    if (!product) {
      throw new ProductError("Produto não encontrado");
    }
    
    return product;
  }

  async updateProduct(
    id: string,
    productData: Partial<IProduct>
  ): Promise<IProduct> {
    if (productData.sellPrice !== undefined && productData.sellPrice < 0) {
      throw new ProductError("Preço de venda não pode ser negativo");
    }
    if (productData.costPrice !== undefined && productData.costPrice < 0) {
      throw new ProductError("Preço de custo não pode ser negativo");
    }

    // Verificar se já existe produto com o mesmo nome (exceto o atual)
    if (productData.name) {
      const searchResult = await this.productRepository.search(productData.name, 1, 1);
      if (searchResult.items.length > 0) {
        const existingProduct = searchResult.items.find((p: IProduct) => 
          p.name.toLowerCase() === productData.name!.toLowerCase() && p._id !== id
        );
        if (existingProduct) {
          throw new ProductError("Já existe um produto com este nome");
        }
      }
    }

    const product = await this.productRepository.update(id, productData);
    
    if (!product) {
      throw new ProductError("Produto não encontrado");
    }

    return product;
  }

  async deleteProduct(id: string): Promise<IProduct> {
    const product = await this.productRepository.delete(id);
    
    if (!product) {
      throw new ProductError("Produto não encontrado");
    }
    
    return product;
  }

  // Métodos específicos usando repository
  async getProductsByType(
    productType: IProduct["productType"],
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productRepository.findByType(productType, page, limit);
    
    return {
      products: result.items,
      total: result.total
    };
  }

  async getProductsByBrand(
    brand: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productRepository.findByBrand(brand, page, limit);
    
    return {
      products: result.items,
      total: result.total
    };
  }

  async searchProducts(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productRepository.search(searchTerm, page, limit);
    
    return {
      products: result.items,
      total: result.total
    };
  }

  async getLowStockProducts(
    threshold: number = 10,
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productRepository.findLowStock(threshold, page, limit);
    
    return {
      products: result.items,
      total: result.total
    };
  }

  async updateStock(
    id: string,
    quantity: number,
    operation: "add" | "subtract" | "set" = "set"
  ): Promise<IProduct> {
    const product = await this.productRepository.updateStock(id, quantity, operation);
    
    if (!product) {
      throw new ProductError("Produto não encontrado");
    }
    
    return product;
  }

  async getProductsByPriceRange(
    minPrice: number,
    maxPrice: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productRepository.findByPriceRange(minPrice, maxPrice, page, limit);
    
    return {
      products: result.items,
      total: result.total
    };
  }

  async getFramesByFilters(
    filters: {
      typeFrame?: string;
      color?: string;
      shape?: string;
      reference?: string;
      modelSunglasses?: string;
      productType?: "prescription_frame" | "sunglasses_frame";
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productRepository.findFrames(filters, page, limit);
    
    return {
      products: result.items,
      total: result.total
    };
  }

  async getLensesByType(
    lensType?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productRepository.findLenses(lensType, page, limit);
    
    return {
      products: result.items,
      total: result.total
    };
  }

  async checkInsufficientStock(
    productIds: string[],
    requiredQuantities: number[]
  ): Promise<{ productId: string; available: number; required: number }[]> {
    return this.productRepository.findInsufficientStock(productIds, requiredQuantities);
  }

  async getProductsByIds(ids: string[]): Promise<IProduct[]> {
    return this.productRepository.findByIds(ids);
  }

  // Métodos para integração com sessões (mantidos para compatibilidade)
  async getProductByIdWithSession(
    id: string,
    session: mongoose.ClientSession
  ): Promise<IProduct | null> {
    // Usar o repository com sessão se disponível
    if (this.productRepository.findByIdWithSession) {
      return this.productRepository.findByIdWithSession(id, session);
    }
    return this.productRepository.findById(id);
  }
  
  async updateProductWithSession(
    id: string,
    productData: Partial<IProduct>,
    session: mongoose.ClientSession
  ): Promise<IProduct | null> {
    // Usar o repository com sessão se disponível
    if (this.productRepository.updateWithSession) {
      return this.productRepository.updateWithSession(id, productData, session);
    }
    return this.productRepository.update(id, productData);
  }
}