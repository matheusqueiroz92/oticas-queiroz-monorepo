import { getRepositories } from "../repositories/RepositoryFactory";
import { IProduct, IPrescriptionFrame, ISunglassesFrame } from "../interfaces/IProduct";
import { OrderProduct } from "../interfaces/IOrder";
import mongoose from "mongoose";
import { StockLog, createStockLogWithSession } from "../schemas/StockLogSchema";

interface IOrderProductForStock {
  productId: string;
  quantity: number;
}

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

export class StockService {
  private productRepository: any;

  constructor() {
    const { productRepository } = getRepositories();
    this.productRepository = productRepository;
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
      return await this.productRepository.findById(productId);
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
   * Validar e converter string para ObjectId se necessário
   * @param value Valor a ser convertido
   * @param defaultValue Valor padrão se a conversão falhar
   * @returns ObjectId válido ou undefined
   */
  private validateAndConvertToObjectId(value: string | undefined, defaultValue?: mongoose.Types.ObjectId): mongoose.Types.ObjectId | undefined {
    if (!value) return defaultValue;
    
    // Se for 'system' ou outro valor padrão, retornar undefined
    if (value === 'system' || value === 'anonymous') {
      return defaultValue;
    }
    
    // Verificar se é um ObjectId válido
    if (mongoose.Types.ObjectId.isValid(value)) {
      return new mongoose.Types.ObjectId(value);
    }
    
    return defaultValue;
  }

  /**
   * Diminui o estoque de um produto quando um pedido é criado
   * @param productId ID do produto
   * @param quantity Quantidade a diminuir
   * @param reason Motivo da diminuição
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
      // Validar se productId é um ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new StockError(`ID do produto inválido: ${productId}`);
      }

      const product = await this.productRepository.findById(productId);
      
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

      // Atualizar o estoque usando repository com sessão da transação
      const updatedProduct = await this.productRepository.updateStock(productId, quantity, "subtract", session);
      
      if (!updatedProduct) {
        throw new StockError(`Falha ao atualizar estoque do produto ${productId}`);
      }
      
      // Preparar dados para o log com validação de ObjectIds
      const logData = {
        productId: new mongoose.Types.ObjectId(productId),
        orderId: this.validateAndConvertToObjectId(orderId),
        previousStock: currentStock,
        newStock,
        quantity,
        operation: 'decrease' as const,
        reason,
        performedBy: this.validateAndConvertToObjectId(performedBy) || new mongoose.Types.ObjectId() // Criar um ObjectId genérico se não for válido
      };

      // Registrar log dentro da transação
      await createStockLogWithSession(logData, session);
      
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
      // Validar se productId é um ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new StockError(`ID do produto inválido: ${productId}`);
      }

      const product = await this.productRepository.findById(productId);
      
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
      
      // Atualizar o estoque usando repository com sessão da transação
      const updatedProduct = await this.productRepository.updateStock(productId, quantity, "add", session);
      
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
   * Processa uma lista de produtos de um pedido (diminuir ou aumentar estoque)
   * @param products Lista de produtos do pedido
   * @param operation Operação a ser realizada (decrease ou increase)
   * @param performedBy ID do usuário que realizou a operação
   * @param orderId ID do pedido relacionado
  */
  async processOrderProducts(
    products: IOrderProductForStock[], 
    operation: 'decrease' | 'increase',
    performedBy: string = 'system',
    orderId?: string
  ): Promise<void> {
    const errors: string[] = [];
    
    for (const orderProduct of products) {
      try {
        if (operation === 'decrease') {
          await this.decreaseStock(
            orderProduct.productId, 
            orderProduct.quantity,
            `Pedido ${orderId ? orderId : 'sem ID'} - produto adicionado`,
            performedBy,
            orderId
          );
        } else {
          await this.increaseStock(
            orderProduct.productId, 
            orderProduct.quantity,
            `Pedido ${orderId ? orderId : 'sem ID'} - produto removido/cancelado`,
            performedBy,
            orderId
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Produto ${orderProduct.productId}: ${message}`);
        console.error(`Erro ao processar produto ${orderProduct.productId}:`, error);
      }
    }
    
    if (errors.length > 0) {
      throw new StockError(`Erros ao processar produtos: ${errors.join('; ')}`);
    }
  }

  /**
   * Verifica se há produtos com estoque insuficiente para um pedido
   * @param products Lista de produtos do pedido
   * @returns Lista de produtos com estoque insuficiente
  */
  async checkStockAvailability(products: IOrderProductForStock[]): Promise<{ productId: string; available: number; required: number }[]> {
    const insufficientStock: { productId: string; available: number; required: number }[] = [];
    
    for (const orderProduct of products) {
      try {
        const product = await this.getProductById(orderProduct.productId);
        
        if (!product) {
          insufficientStock.push({
            productId: orderProduct.productId,
            available: 0,
            required: orderProduct.quantity
          });
          continue;
        }
        
        // Se não for um produto de armação, considerar como disponível
        if (!this.isFrameProduct(product)) {
          continue;
        }
        
        const currentStock = product.stock || 0;
        
        if (currentStock < orderProduct.quantity) {
          insufficientStock.push({
            productId: orderProduct.productId,
            available: currentStock,
            required: orderProduct.quantity
          });
        }
      } catch (error) {
        console.error(`Erro ao verificar estoque do produto ${orderProduct.productId}:`, error);
        insufficientStock.push({
          productId: orderProduct.productId,
          available: 0,
          required: orderProduct.quantity
        });
      }
    }
    
    return insufficientStock;
  }

  /**
   * Obtém o histórico de alterações de estoque de um produto
   * @param productId ID do produto
   * @returns Histórico de estoque
  */
  async getProductStockHistory(productId: string) {
    try {
      return await StockLog.find({ productId: new mongoose.Types.ObjectId(productId) })
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (error) {
      console.error(`Erro ao buscar histórico de estoque do produto ${productId}:`, error);
      return [];
    }
  }

  /**
   * Cria um log de alteração de estoque com sessão de transação
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
      // Validar se productId é um ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(`ID do produto inválido: ${productId}`);
      }

      const logData = {
        productId: new mongoose.Types.ObjectId(productId),
        orderId: this.validateAndConvertToObjectId(orderId),
        previousStock,
        newStock,
        quantity,
        operation,
        reason,
        performedBy: this.validateAndConvertToObjectId(performedBy) || new mongoose.Types.ObjectId() // Criar um ObjectId genérico se não for válido
      };

      if (session) {
        await createStockLogWithSession(logData, session);
      } else {
        await StockLog.create(logData);
      }
    } catch (error) {
      console.error('Erro ao criar log de estoque:', error);
      throw error; // Re-throw para que o erro seja propagado
    }
  }

  // Métodos específicos usando repository
  async getLowStockProducts(threshold: number = 10): Promise<IProduct[]> {
    try {
      const result = await this.productRepository.findLowStock(threshold, 1, 100);
      return result.items;
    } catch (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error);
      return [];
    }
  }

  async getOutOfStockProducts(): Promise<IProduct[]> {
    try {
      const result = await this.productRepository.findLowStock(0, 1, 100);
      return result.items.filter((product: IProduct) => 
        this.isFrameProduct(product) && (product.stock || 0) === 0
      );
    } catch (error) {
      console.error('Erro ao buscar produtos sem estoque:', error);
      return [];
    }
  }

  async updateProductStock(
    productId: string,
    newStock: number,
    reason: string = 'Ajuste manual',
    performedBy: string = 'system'
  ): Promise<IProduct | null> {
    try {
      const product = await this.getProductById(productId);
      
      if (!product) {
        throw new StockError(`Produto com ID ${productId} não encontrado`);
      }
      
      if (!this.isFrameProduct(product)) {
        throw new StockError(`Produto ${product.name} não possui controle de estoque`);
      }
      
      const currentStock = product.stock || 0;
      const updatedProduct = await this.productRepository.updateStock(productId, newStock, "set");
      
      if (updatedProduct) {
        await this.createStockLog(
          productId,
          currentStock,
          newStock,
          Math.abs(newStock - currentStock),
          newStock > currentStock ? 'increase' : 'decrease',
          reason,
          performedBy
        );
      }
      
      return updatedProduct;
    } catch (error) {
      console.error(`Erro ao atualizar estoque do produto ${productId}:`, error);
      if (error instanceof StockError) {
        throw error;
      }
      throw new StockError(`Erro ao atualizar estoque: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}