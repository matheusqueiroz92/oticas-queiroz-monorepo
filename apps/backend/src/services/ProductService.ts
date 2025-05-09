import { ProductModel } from "../models/ProductModel";
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
  private productModel: ProductModel;

  constructor() {
    this.productModel = new ProductModel();
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

    const existingProduct = await this.productModel.findByName(productData.name);
    if (existingProduct) {
      throw new ProductError("Produto já cadastrado com este nome");
    }

    return this.productModel.create(productData);
  }

  async getAllProducts(
    page?: number,
    limit?: number,
    filters?: Record<string, any>
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productModel.findAll(page, limit, filters);
    
    if (result.total === 0) {
      throw new ProductError("Nenhum produto encontrado");
    }
    
    return result;
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await this.productModel.findById(id);
    
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

    if (productData.name) {
      const existingProduct = await this.productModel.findByName(productData.name);
      if (existingProduct && existingProduct._id !== id) {
        throw new ProductError("Já existe um produto com este nome");
      }
    }

    const product = await this.productModel.update(id, productData);
    
    if (!product) {
      throw new ProductError("Produto não encontrado");
    }

    return product;
  }

  async deleteProduct(id: string): Promise<IProduct> {
    const product = await this.productModel.delete(id);
    
    if (!product) {
      throw new ProductError("Produto não encontrado");
    }
    
    return product;
  }

  async getProductByIdWithSession(
    id: string,
    session: mongoose.ClientSession
  ): Promise<IProduct | null> {
    return this.productModel.findByIdWithSession(id, session);
  }
  
  async updateProductWithSession(
    id: string,
    productData: Partial<IProduct>,
    session: mongoose.ClientSession
  ): Promise<IProduct | null> {
    return this.productModel.updateWithSession(id, productData, session);
  }
}