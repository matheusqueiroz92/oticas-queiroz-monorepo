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
    console.log(`Iniciando diminuição de estoque para produto ${productId}, quantidade: ${quantity}`);
    
    const product = await this.getProductById(productId);
    
    if (!product) {
      console.error(`Produto com ID ${productId} não encontrado`);
      throw new StockError(`Produto com ID ${productId} não encontrado`);
    }
    
    console.log(`Produto encontrado: ${product.name}, tipo: ${product.productType}`);
    
    if (!this.isFrameProduct(product)) {
      console.log(`Produto ${productId} não é do tipo armação, não precisa de controle de estoque`);
      return product;
    }
    
    // Garantir que stock não seja undefined
    const currentStock = product.stock ?? 0;
    console.log(`Estoque atual: ${currentStock}`);
    
    if (currentStock < quantity) {
      console.error(`Estoque insuficiente para o produto ${product.name}. Disponível: ${currentStock}, Necessário: ${quantity}`);
      throw new StockError(`Estoque insuficiente para o produto ${product.name}. Disponível: ${currentStock}`);
    }
    
    const newStock = currentStock - quantity;
    console.log(`Novo estoque após diminuição: ${newStock}`);
    
    // Usar o método updateStock modificado
    try {
      const updatedProduct = await this.productModel.updateStock(productId, -quantity);
      
      if (!updatedProduct) {
        console.error(`Falha ao atualizar estoque do produto ${productId}`);
        throw new StockError(`Falha ao atualizar estoque do produto ${productId}`);
      }
      
      // Verificação adicional
      if (updatedProduct.stock !== newStock) {
        console.error(`ATENÇÃO: Discrepância no estoque! Tentando atualização alternativa...`);
        // Tentar atualização direta como fallback
        const fallbackUpdate = await this.productModel.update(productId, { stock: newStock });
        if (!fallbackUpdate || fallbackUpdate.stock !== newStock) {
          console.error(`FALHA CRÍTICA: Não foi possível atualizar o estoque do produto ${productId}`);
          throw new StockError(`Falha crítica ao atualizar estoque do produto ${productId}`);
        }
        console.log(`Estoque atualizado via fallback para: ${fallbackUpdate.stock}`);
      }
      
      console.log(`Estoque atualizado com sucesso para ${updatedProduct.stock}`);
      
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
      console.error(`Erro ao atualizar estoque do produto ${productId}:`, error);
      throw new StockError(`Erro ao atualizar estoque: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    
    // Usar o método updateStock para uma atualização atômica
    const updatedProduct = await this.productModel.updateStock(productId, quantity);
    
    if (!updatedProduct) {
      throw new StockError(`Falha ao atualizar estoque do produto ${productId}`);
    }
    
    // Verificação após atualização
    const verifiedProduct = await this.productModel.findById(productId);
    console.log(`Verificação - Estoque após aumento: ${verifiedProduct?.stock}`);
    
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
    console.log(`Processando ${products.length} produtos para operação: ${operation}`);
    
    for (const product of products) {
      let productId: string;
      let productObject: IProduct | null = null;
      
      // Determinar o ID do produto
      if (typeof product === 'string') {
        productId = product;
        console.log(`Produto é uma string ID: ${productId}`);
      } else if (product instanceof mongoose.Types.ObjectId) {
        productId = product.toString();
        console.log(`Produto é um ObjectId: ${productId}`);
      } else if (typeof product === 'object' && product !== null && '_id' in product) {
        productId = product._id.toString();
        productObject = product as IProduct;
        console.log(`Produto é um objeto completo. ID: ${productId}, Tipo: ${productObject.productType}`);
      } else {
        console.error(`Formato de produto inválido:`, product);
        throw new StockError(`Formato de produto inválido: ${JSON.stringify(product)}`);
      }
      
      // Se já temos o objeto do produto, verificamos diretamente
      if (productObject) {
        const isFrameProduct = 
          productObject.productType === 'prescription_frame' || 
          productObject.productType === 'sunglasses_frame';
        
        console.log(`Produto ${productId} é do tipo frame? ${isFrameProduct}`);
        
        // Se não for um produto de armação, pular
        if (!isFrameProduct) {
          console.log(`Produto ${productId} não é do tipo armação, pulando atualização de estoque`);
          continue;
        }
      } else {
        // Se não temos o objeto, precisamos buscá-lo para verificar o tipo
        const fetchedProduct = await this.getProductById(productId);
        if (!fetchedProduct) {
          console.error(`Produto com ID ${productId} não encontrado`);
          throw new StockError(`Produto com ID ${productId} não encontrado`);
        }
        
        const isFrameProduct = 
          fetchedProduct.productType === 'prescription_frame' || 
          fetchedProduct.productType === 'sunglasses_frame';
        
        console.log(`Produto ${productId} é do tipo frame? ${isFrameProduct}`);
        
        // Se não for um produto de armação, pular
        if (!isFrameProduct) {
          console.log(`Produto ${productId} não é do tipo armação, pulando atualização de estoque`);
          continue;
        }
      }
      
      // Atualizar o estoque
      if (operation === 'decrease') {
        console.log(`Diminuindo estoque do produto ${productId}`);
        await this.decreaseStock(productId, 1, 'Pedido criado', performedBy, orderId);
      } else {
        console.log(`Aumentando estoque do produto ${productId}`);
        await this.increaseStock(productId, 1, 'Pedido cancelado', performedBy, orderId);
      }
    }
  }
}