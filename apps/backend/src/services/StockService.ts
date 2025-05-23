import { ProductModel } from "../models/ProductModel";
import { IProduct, IPrescriptionFrame, ISunglassesFrame } from "../interfaces/IProduct";
import { OrderProduct } from "../interfaces/IOrder";
import mongoose from "mongoose";
import { StockLog, createStockLogWithSession } from "../schemas/StockLogSchema";

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
    const session = await mongoose.connection.startSession();
    session.startTransaction();
    
    try {
      const product = await this.productModel.findByIdWithSession(productId, session);
      
      if (!product) {
        throw new StockError(`Produto com ID ${productId} não encontrado`);
      }
      
      // Se não for um produto de armação, não mexer no estoque
      if (!this.isFrameProduct(product)) {
        await session.commitTransaction();
        return product;
      }
      
      const currentStock = product.stock || 0;
      
      if (currentStock < quantity) {
        throw new StockError(`Estoque insuficiente para o produto ${product.name}. Disponível: ${currentStock}, Necessário: ${quantity}`);
      }
      
      const newStock = currentStock - quantity;

      // Atualizar o estoque dentro da transação
      const updatedProduct = await this.productModel.decreaseStockWithSession(productId, quantity, session);
      
      if (!updatedProduct) {
        throw new StockError(`Falha ao atualizar estoque do produto ${productId}`);
      }
      
      // Registrar log dentro da transação
      await createStockLogWithSession({
        productId: new mongoose.Types.ObjectId(productId),
        orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
        previousStock: currentStock,
        newStock,
        quantity,
        operation: 'decrease',
        reason,
        performedBy: new mongoose.Types.ObjectId(performedBy)
      }, session);
      
      // Tudo deu certo, comitar a transação
      await session.commitTransaction();
      
      return updatedProduct;
    } catch (error) {
      // Algo deu errado, abortar a transação
      await session.abortTransaction();
      console.error(`Erro ao reduzir estoque para ${productId}:`, error);
      
      if (error instanceof StockError) {
        throw error;
      }
      throw new StockError(`Erro desconhecido ao processar estoque: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      session.endSession();
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
    const session = await mongoose.connection.startSession();
    session.startTransaction();
    
    try {
      const product = await this.productModel.findByIdWithSession(productId, session);
      
      if (!product) {
        throw new StockError(`Produto com ID ${productId} não encontrado`);
      }
      
      // Se não for um produto de armação, não mexer no estoque
      if (!this.isFrameProduct(product)) {
        await session.commitTransaction();
        return product;
      }
      
      const currentStock = product.stock || 0;
      const newStock = currentStock + quantity;
      
      // Atualizar o estoque dentro da transação
      const updatedProduct = await this.productModel.increaseStockWithSession(productId, quantity, session);
      
      if (!updatedProduct) {
        throw new StockError(`Falha ao atualizar estoque do produto ${productId}`);
      }
      
      // Registrar log dentro da transação
      await this.createStockLogWithSession(
        productId,
        currentStock,
        newStock,
        quantity,
        'increase',
        reason,
        performedBy,
        orderId,
        session
      );
      
      // Tudo deu certo, comitar a transação
      await session.commitTransaction();
      
      return updatedProduct;
    } catch (error) {
      // Algo deu errado, abortar a transação
      await session.abortTransaction();
      console.error(`Erro ao aumentar estoque para ${productId}:`, error);
      
      if (error instanceof StockError) {
        throw error;
      }
      throw new StockError(`Erro desconhecido ao processar estoque: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      session.endSession();
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
    // Iniciar uma sessão de transação
    const session = await mongoose.connection.startSession();
    session.startTransaction();
    
    try {
      // Contadores para log
      let atualizados = 0;
      let ignorados = 0;
      
      for (const product of products) {
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
          throw new StockError(`Formato de produto inválido: ${product}`);
        }
        
        // Buscar o produto completo para verificar o tipo (usando a sessão)
        const productDetails = await this.productModel.findByIdWithSession(productId, session);
        
        // Se não for uma armação, pular
        if (!productDetails || !this.isFrameProduct(productDetails)) {
          ignorados++;
          continue;
        }
        
        // Realizar a operação adequada
        let updatedProduct;
        let previousStock: number;
        let newStock: number;
        
        if (operation === 'decrease') {
          previousStock = productDetails.stock || 0;
          updatedProduct = await this.productModel.decreaseStockWithSession(productId, 1, session);
          if (updatedProduct && 'stock' in updatedProduct) {
            newStock = updatedProduct.stock ?? 0;
          } else {
            throw new StockError(`Falha ao atualizar estoque do produto ${productId}`);
          }
          
          // Registrar log dentro da transação
          await createStockLogWithSession({
            productId: new mongoose.Types.ObjectId(productId),
            orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
            previousStock,
            newStock,
            quantity: 1,
            operation: 'decrease',
            reason: 'Pedido criado',
            performedBy: new mongoose.Types.ObjectId(performedBy)
          }, session);
        } else {
          previousStock = productDetails.stock || 0;
          updatedProduct = await this.productModel.increaseStockWithSession(productId, 1, session);
          if (updatedProduct && 'stock' in updatedProduct) {
            newStock = updatedProduct.stock ?? 0;
          } else {
            throw new StockError(`Falha ao atualizar estoque do produto ${productId}`);
          }
          
          // Registrar log dentro da transação
          await createStockLogWithSession({
            productId: new mongoose.Types.ObjectId(productId),
            orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
            previousStock,
            newStock,
            quantity: 1,
            operation: 'increase',
            reason: 'Pedido cancelado/revertido',
            performedBy: new mongoose.Types.ObjectId(performedBy)
          }, session);
        }
        
        atualizados++;
      }
      
      // Se chegou aqui, tudo ocorreu bem, então comita a transação
      await session.commitTransaction();
    } catch (error) {
      // Algo deu errado, aborta a transação
      await session.abortTransaction();
      console.error(`Erro ao processar estoque para produtos. Transação abortada:`, error);
      throw new StockError(`Erro ao processar estoque: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Sempre finaliza a sessão
      session.endSession();
    }
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

  /**
   * Cria um log de alteração de estoque com uma sessão de transação
  */
  async createStockLogWithSession(
    productId: string, 
    previousStock: number, 
    newStock: number, 
    quantity: number, 
    operation: 'increase' | 'decrease',
    reason: string,
    performedBy: string,
    orderId?: string,
    session?: mongoose.ClientSession
  ): Promise<void> {
    try {
      const logData = {
        productId: new mongoose.Types.ObjectId(productId),
        orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
        previousStock,
        newStock,
        quantity,
        operation,
        reason,
        performedBy: new mongoose.Types.ObjectId(performedBy)
      };
      
      if (session) {
        await createStockLogWithSession(logData, session);
      } else {
        await StockLog.create(logData);
      }
    } catch (error) {
      console.error('Erro ao criar log de estoque:', error);
      throw error;
    }
  }
}