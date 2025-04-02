import { ProductModel } from "../models/ProductModel";
import { IProduct, IPrescriptionFrame, ISunglassesFrame } from "../interfaces/IProduct";
import { OrderProduct } from "../interfaces/IOrder";
import mongoose from "mongoose";
import { StockLog } from "../schemas/StockLogSchema";
import {
  PrescriptionFrame, 
  SunglassesFrame 
} from "../schemas/ProductSchema";

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

  /**
   * Verifica se um produto é do tipo que possui controle de estoque (apenas armações)
   * @param product Produto a ser verificado
   * @returns true se for um produto com controle de estoque, false caso contrário
   */
  private isFrameProduct(product: IProduct): product is IPrescriptionFrame | ISunglassesFrame {
    return product.productType === 'prescription_frame' || product.productType === 'sunglasses_frame';
  }

  /**
   * Obtém um produto pelo ID
   * @param productId ID do produto
   * @returns Produto ou null se não encontrado
   */
  private async getProductById(productId: string): Promise<IProduct | null> {
    try {
      return await this.productModel.findById(productId);
    } catch (error) {
      console.error(`Erro ao buscar produto com ID ${productId}:`, error);
      return null;
    }
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
        productId: new mongoose.Types.ObjectId(productId),
        orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
        previousStock,
        newStock,
        quantity,
        operation,
        reason,
        performedBy: new mongoose.Types.ObjectId(performedBy)
      });
      
      console.log(`Log de estoque criado: ${operation} de ${quantity} unidades do produto ${productId}`);
    } catch (error) {
      console.error('Erro ao criar log de estoque:', error);
    }
  }

  /**
   * Reduz o estoque de um produto quando um pedido é criado
   * @param productId ID do produto
   * @param quantity Quantidade a reduzir
   * @param reason Motivo da redução
   * @param performedBy ID do usuário que realizou a operação
   * @param orderId ID do pedido relacionado
   * @returns Produto atualizado ou null
   */
  async decreaseStock(
    productId: string, 
    quantity = 1, 
    reason = 'Pedido criado', 
    performedBy: string = 'system',
    orderId?: string
  ): Promise<IProduct | null> {
    try {
      const product = await this.getProductById(productId);
      
      if (!product) {
        throw new StockError(`Produto com ID ${productId} não encontrado`);
      }
      
      // Se não for um produto de armação, não mexer no estoque
      if (!this.isFrameProduct(product)) {
        console.log(`Produto ${productId} (${product.name}) não é uma armação, ignorando atualização de estoque.`);
        return product;
      }
      
      const currentStock = product.stock || 0;
      
      if (currentStock < quantity) {
        throw new StockError(`Estoque insuficiente para o produto ${product.name}. Disponível: ${currentStock}, Necessário: ${quantity}`);
      }
      
      const newStock = currentStock - quantity;
      
      console.log(`Atualizando estoque do produto ${productId} (${product.name}) de ${currentStock} para ${newStock}`);
      
      // Usar diretamente o modelo Mongoose para garantir a atualização
      // Usamos o modelo correto com base no tipo de produto
      let result;
      if (product.productType === 'prescription_frame') {
        result = await PrescriptionFrame.findByIdAndUpdate(
          productId,
          { $set: { stock: newStock } },
          { new: true }
        );
      } else if (product.productType === 'sunglasses_frame') {
        result = await SunglassesFrame.findByIdAndUpdate(
          productId,
          { $set: { stock: newStock } },
          { new: true }
        );
      }
      
      if (!result) {
        throw new StockError(`Falha ao atualizar estoque do produto ${productId}`);
      }
      
      // Verificar se a atualização realmente aconteceu
      const updatedProduct = await this.getProductById(productId);
      const updatedStock = updatedProduct?.stock || 0;
      
      if (updatedStock !== newStock) {
        console.error(`Atenção: O estoque não foi atualizado corretamente. Esperado: ${newStock}, Atual: ${updatedStock}`);
      } else {
        console.log(`Estoque atualizado com sucesso para ${newStock}`);
      }
      
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
    } catch (error) {
      console.error(`Erro ao reduzir estoque para ${productId}:`, error);
      if (error instanceof StockError) {
        throw error;
      }
      throw new StockError(`Erro desconhecido ao processar estoque: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Aumenta o estoque de um produto quando um pedido é cancelado
   * @param productId ID do produto
   * @param quantity Quantidade a aumentar
   * @param reason Motivo do aumento
   * @param performedBy ID do usuário que realizou a operação
   * @param orderId ID do pedido relacionado
   * @returns Produto atualizado ou null
   */
  async increaseStock(
    productId: string, 
    quantity = 1, 
    reason = 'Pedido cancelado', 
    performedBy: string = 'system',
    orderId?: string
  ): Promise<IProduct | null> {
    try {
      const product = await this.getProductById(productId);
      
      if (!product) {
        throw new StockError(`Produto com ID ${productId} não encontrado`);
      }
      
      // Se não for um produto de armação, não mexer no estoque
      if (!this.isFrameProduct(product)) {
        console.log(`Produto ${productId} (${product.name}) não é uma armação, ignorando atualização de estoque.`);
        return product;
      }
      
      const currentStock = product.stock || 0;
      const newStock = currentStock + quantity;
      
      console.log(`Atualizando estoque do produto ${productId} (${product.name}) de ${currentStock} para ${newStock}`);
      
      // Usar diretamente o modelo Mongoose para garantir a atualização
      // Usamos o modelo correto com base no tipo de produto
      let result;
      if (product.productType === 'prescription_frame') {
        result = await PrescriptionFrame.findByIdAndUpdate(
          productId,
          { $set: { stock: newStock } },
          { new: true }
        );
      } else if (product.productType === 'sunglasses_frame') {
        result = await SunglassesFrame.findByIdAndUpdate(
          productId,
          { $set: { stock: newStock } },
          { new: true }
        );
      }
      
      if (!result) {
        throw new StockError(`Falha ao atualizar estoque do produto ${productId}`);
      }
      
      // Verificar se a atualização realmente aconteceu
      const updatedProduct = await this.getProductById(productId);
      const updatedStock = updatedProduct?.stock || 0;
      
      if (updatedStock !== newStock) {
        console.error(`Atenção: O estoque não foi atualizado corretamente. Esperado: ${newStock}, Atual: ${updatedStock}`);
      } else {
        console.log(`Estoque atualizado com sucesso para ${newStock}`);
      }
      
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
    } catch (error) {
      console.error(`Erro ao aumentar estoque para ${productId}:`, error);
      if (error instanceof StockError) {
        throw error;
      }
      throw new StockError(`Erro desconhecido ao processar estoque: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Processa múltiplos produtos de um pedido para atualização de estoque
   * @param products Lista de produtos
   * @param operation Operação (decrease para criar pedido, increase para cancelar)
   * @param performedBy ID do usuário que realizou a operação
   * @param orderId ID do pedido relacionado
   */
  async processOrderProducts(
    products: OrderProduct[], 
    operation: 'decrease' | 'increase',
    performedBy: string = 'system',
    orderId?: string
  ): Promise<void> {
    console.log(`Processando estoque para ${products.length} produtos. Operação: ${operation}`);
    
    // Contadores para log
    let atualizados = 0;
    let ignorados = 0;
    let erros = 0;
    
    for (const product of products) {
      try {
        let productId: string;
        
        // Extrair o ID do produto conforme o formato
        if (typeof product === 'string') {
          productId = product;
        } else if (product instanceof mongoose.Types.ObjectId) {
          productId = product.toString();
        } else if (typeof product === 'object' && product !== null && '_id' in product) {
          productId = typeof product._id === 'string' ? product._id : (product._id as mongoose.Types.ObjectId).toString();
        } else {
          console.error(`Formato de produto inválido:`, product);
          erros++;
          continue;
        }
        
        // Buscar o produto completo para verificar o tipo
        const productDetails = await this.getProductById(productId);
        
        // Se não for uma armação, pular
        if (!productDetails || !this.isFrameProduct(productDetails)) {
          console.log(`Produto ${productId} não é uma armação, ignorando estoque.`);
          ignorados++;
          continue;
        }
        
        console.log(`Processando estoque para armação ${productId} (${productDetails.name})`);
        
        // Realizar a operação adequada
        if (operation === 'decrease') {
          await this.decreaseStock(productId, 1, 'Pedido criado', performedBy, orderId);
        } else {
          await this.increaseStock(productId, 1, 'Pedido cancelado/revertido', performedBy, orderId);
        }
        
        atualizados++;
      } catch (error) {
        console.error(`Erro ao processar estoque para produto:`, error);
        erros++;
      }
    }
    
    console.log(`Processamento de estoque concluído. Armações atualizadas: ${atualizados}, Ignorados (não armações): ${ignorados}, Erros: ${erros}`);
  }

  /**
 * Obtém o histórico de estoque de um produto específico
 * @param productId ID do produto
 * @returns Array com histórico de movimentações
 */
  async getProductStockHistory(productId: string) {
    try {
      // Verificar se o produto existe e é do tipo com estoque
      const product = await this.getProductById(productId);
      if (!product) {
        throw new StockError(`Produto com ID ${productId} não encontrado`);
      }
      
      if (!this.isFrameProduct(product)) {
        throw new StockError(`Produto ${product.name} não possui controle de estoque.`);
      }
      
      // Buscar histórico no modelo StockLog
      const history = await StockLog.find({ 
        productId: new mongoose.Types.ObjectId(productId) 
      })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name')
      .populate('orderId', 'serviceOrder')
      .exec();
      
      return history;
    } catch (error) {
      console.error(`Erro ao obter histórico de estoque para produto ${productId}:`, error);
      if (error instanceof StockError) {
        throw error;
      }
      throw new StockError(`Erro ao buscar histórico de estoque: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}