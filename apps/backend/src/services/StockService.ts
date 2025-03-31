import { ProductModel } from "../models/ProductModel";
import { IProduct, IPrescriptionFrame, ISunglassesFrame } from "../interfaces/IProduct";
import { OrderProduct } from "../interfaces/IOrder";
import mongoose from "mongoose";
import { StockLog } from "../schemas/StockLogSchema";

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

export class StockService {
  private productModel: ProductModel;

  constructor() {
    this.productModel = new ProductModel();
  }

  private isFrameProduct(product: IProduct): product is IPrescriptionFrame | ISunglassesFrame {
    return product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame';
  }

  private async getProductById(productId: string): Promise<IProduct | null> {
    return this.productModel.findById(productId);
  }

  /**
   * Cria um log de alteração de estoque
   */
  async createStockLog(
    productId: string, 
    previousStock: number, 
    newStock: number, 
    quantity: number, 
    operation: 'increase' | 'decrease',
    reason: string,
    performedBy: string,
    orderId?: string
  ): Promise<void> {
    try {
      await StockLog.create({
        productId,
        orderId,
        previousStock,
        newStock,
        quantity,
        operation,
        reason,
        performedBy
      });
    } catch (error) {
      console.error('Erro ao criar log de estoque:', error);
    }
  }

  /**
   * Reduz o estoque de um produto quando um pedido é criado
   * @param productId ID do produto
   * @param quantity Quantidade a ser reduzida (padrão: 1)
   * @param reason Motivo da redução (padrão: 'Pedido criado')
   * @param performedBy ID do usuário que realizou a operação
   * @param orderId ID do pedido relacionado (opcional)
   */
  async decreaseStock(
    productId: string, 
    quantity = 1, 
    reason = 'Pedido criado', 
    performedBy: string = 'system',
    orderId?: string
  ): Promise<IProduct | null> {
    const product = await this.getProductById(productId);
    
    if (!product) {
      throw new StockError(`Produto com ID ${productId} não encontrado`);
    }
    
    if (!this.isFrameProduct(product)) {
      // Não é um produto que precisa controle de estoque
      return product;
    }
    
    const currentStock = product.stock || 0;
    
    if (currentStock < quantity) {
      throw new StockError(`Estoque insuficiente para o produto ${product.name}. Disponível: ${currentStock}`);
    }
    
    const newStock = currentStock - quantity;
    
    // É seguro usar stock aqui porque já confirmamos que é um produto de armação
    const updateData: Partial<IProduct> = { stock: newStock };
    
    const updatedProduct = await this.productModel.update(productId, updateData);
    
    // Registrar log
    await this.createStockLog(
      productId,
      currentStock,
      newStock,
      quantity,
      'decrease',
      reason,
      performedBy,
      orderId
    );
    
    return updatedProduct;
  }

  /**
   * Aumenta o estoque de um produto quando um pedido é cancelado
   * @param productId ID do produto
   * @param quantity Quantidade a ser aumentada (padrão: 1)
   * @param reason Motivo do aumento (padrão: 'Pedido cancelado')
   * @param performedBy ID do usuário que realizou a operação
   * @param orderId ID do pedido relacionado (opcional)
   */
  async increaseStock(
    productId: string, 
    quantity = 1, 
    reason = 'Pedido cancelado', 
    performedBy: string = 'system',
    orderId?: string
  ): Promise<IProduct | null> {
    const product = await this.getProductById(productId);
    
    if (!product) {
      throw new StockError(`Produto com ID ${productId} não encontrado`);
    }
    
    if (!this.isFrameProduct(product)) {
      // Não é um produto que precisa controle de estoque
      return product;
    }
    
    const currentStock = product.stock || 0;
    const newStock = currentStock + quantity;
    
    // É seguro usar stock aqui porque já confirmamos que é um produto de armação
    const updateData: Partial<IProduct> = { stock: newStock };
    
    const updatedProduct = await this.productModel.update(productId, updateData);
    
    // Registrar log
    await this.createStockLog(
      productId,
      currentStock,
      newStock,
      quantity,
      'increase',
      reason,
      performedBy,
      orderId
    );
    
    return updatedProduct;
  }
  
  /**
   * Processa múltiplos produtos de um pedido para atualização de estoque
   * @param products Array de produtos ou IDs de produtos
   * @param operation 'decrease' para diminuir o estoque, 'increase' para aumentar
   * @param performedBy ID do usuário que realizou a operação
   * @param orderId ID do pedido relacionado (opcional)
   */
  async processOrderProducts(
    products: OrderProduct[], 
    operation: 'decrease' | 'increase',
    performedBy: string = 'system',
    orderId?: string
  ): Promise<void> {
    for (const product of products) {
      let productId: string;
      
      if (typeof product === 'string') {
        productId = product;
      } else if (product instanceof mongoose.Types.ObjectId) {
        productId = product.toString();
      } else if (typeof product === 'object' && product !== null && '_id' in product) {
        productId = product._id.toString();
      } else {
        throw new StockError(`Formato de produto inválido: ${JSON.stringify(product)}`);
      }
      
      if (operation === 'decrease') {
        await this.decreaseStock(productId, 1, 'Pedido criado', performedBy, orderId?.toString());
      } else {
        await this.increaseStock(productId, 1, 'Pedido cancelado', performedBy, orderId?.toString());
      }
    }
  }
}