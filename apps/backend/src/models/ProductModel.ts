import mongoose, { Types, FilterQuery } from "mongoose";
import { 
  Product, 
  Lens, 
  CleanLens, 
  PrescriptionFrame, 
  SunglassesFrame
} from "../schemas/ProductSchema";
import { 
  IProduct, 
  ILens, 
  ICleanLens, 
  IPrescriptionFrame, 
  ISunglassesFrame,
} from "../interfaces/IProduct";

export class ProductModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  private convertToIProduct(doc: any): IProduct {
    const rawDoc = doc.toObject ? doc.toObject() : doc;
    
    const baseProduct: IProduct = {
      _id: rawDoc._id.toString(),
      productType: rawDoc.productType,
      name: rawDoc.name,
      description: rawDoc.description,
      sellPrice: typeof rawDoc.sellPrice === 'number' ? rawDoc.sellPrice : 0,
      image: rawDoc.image,
      brand: rawDoc.brand,
      costPrice: rawDoc.costPrice,
      stock: typeof rawDoc.stock === 'number' ? rawDoc.stock : 
             (rawDoc.stock ? Number(rawDoc.stock) : undefined),
      createdAt: rawDoc.createdAt,
      updatedAt: rawDoc.updatedAt
    };
  
    switch (rawDoc.productType) {
      case 'lenses':
        return {
          ...baseProduct,
          lensType: rawDoc.lensType
        } as ILens;
      
      case 'clean_lenses':
        return baseProduct as ICleanLens;
      
      case 'prescription_frame':
        return {
          ...baseProduct,
          typeFrame: rawDoc.typeFrame,
          color: rawDoc.color,
          shape: rawDoc.shape,
          reference: rawDoc.reference,
          stock: typeof rawDoc.stock === 'number' ? rawDoc.stock : 
                 (rawDoc.stock ? Number(rawDoc.stock) : 0)
        } as IPrescriptionFrame;
      
      case 'sunglasses_frame':
        return {
          ...baseProduct,
          modelSunglasses: rawDoc.modelSunglasses || rawDoc.model,
          typeFrame: rawDoc.typeFrame,
          color: rawDoc.color,
          shape: rawDoc.shape,
          reference: rawDoc.reference,
          stock: typeof rawDoc.stock === 'number' ? rawDoc.stock : 
                 (rawDoc.stock ? Number(rawDoc.stock) : 0)
        } as ISunglassesFrame;
      
      default:
        return baseProduct;
    }
  }

   /**
   * Atualiza diretamente o valor de estoque no MongoDB, contornando o Mongoose.
   * Esta abordagem é necessária porque o Mongoose com discriminators pode ter
   * problemas ao atualizar o campo stock em alguns cenários.
   */
   private async updateStockDirectly(id: string, stockValue: number): Promise<boolean> {
    try {
      console.log(`Tentando atualizar estoque para ${stockValue} usando operação direta no MongoDB`);
      
      // Obter a conexão direta com o MongoDB
      const db = mongoose.connection.db;
      const collection = db?.collection('products');
      
      // Executar uma operação direta
      const result = await collection?.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { stock: stockValue } }
      );
      
      console.log(`Resultado da operação direta MongoDB: ${JSON.stringify(result)}`);
      return (result?.modifiedCount ?? 0) > 0;
    } catch (error) {
      console.error(`Erro ao atualizar estoque diretamente: ${error}`);
      return false;
    }
  }

  async create(productData: Omit<IProduct, "_id">): Promise<IProduct> {
    let savedProduct;
    
    switch (productData.productType) {
      case 'lenses':
        savedProduct = await new Lens(productData).save();
        break;
      case 'clean_lenses':
        savedProduct = await new CleanLens(productData).save();
        break;
      case 'prescription_frame':
        savedProduct = await new PrescriptionFrame(productData).save();
        break;
      case 'sunglasses_frame':
        savedProduct = await new SunglassesFrame(productData).save();
        break;
      default:
        throw new Error(`Tipo de produto inválido: ${productData.productType}`);
    }

    return this.convertToIProduct(savedProduct);
  }

  async findByName(name: string): Promise<IProduct | null> {
    const product = await Product.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    
    return product ? this.convertToIProduct(product) : null;
  }

  async findById(id: string): Promise<IProduct | null> {
    if (!this.isValidId(id)) return null;
    
    const product = await Product.findById(id);
    return product ? this.convertToIProduct(product) : null;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {}
  ): Promise<{ products: IProduct[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as FilterQuery<any>);

    const [productsResult, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    return {
      products: productsResult.map(product => this.convertToIProduct(product)),
      total,
    };
  }

  /**
   * Atualiza um produto pelo seu ID.
   * Usa acesso direto ao MongoDB para garantir que o campo stock seja atualizado corretamente
   * para resolver problemas com discriminators do Mongoose.
   */
  async update(
    id: string,
    productData: Partial<IProduct>
  ): Promise<IProduct | null> {
    if (!this.isValidId(id)) return null;
    
    try {
      // Tratar o estoque separadamente
      const stockValue = productData.stock !== undefined ? Number(productData.stock) : undefined;
      delete productData.stock; // Remover do objeto principal
      
      console.log(`Atualizando produto ${id} com dados:`, JSON.stringify(productData));
      
      // 1. Primeiro atualize os outros campos
      await Product.findByIdAndUpdate(
        id,
        { $set: productData }
      );
      
      // 2. Se temos um valor de estoque, atualizá-lo usando a função auxiliar
      if (stockValue !== undefined) {
        await this.updateStockDirectly(id, stockValue);
      }
      
      // 3. Buscar o produto atualizado para confirmar
      const updatedProduct = await Product.findById(id);
      
      // 4. Log com todos os detalhes do produto atualizado
      if (updatedProduct) {
        console.log(`PRODUTO ATUALIZADO [ID: ${id}]:`, JSON.stringify(updatedProduct));
        console.log(`STOCK FINAL: ${(updatedProduct as any).stock}`);
      }
      
      return updatedProduct ? this.convertToIProduct(updatedProduct) : null;
    } catch (error) {
      console.error(`Erro ao atualizar produto ${id}:`, error);
      return null;
    }
  }

  async updateStock(
    id: string,
    stockChange: number
  ): Promise<IProduct | null> {
    if (!this.isValidId(id)) {
      console.error(`[ProductModel] ID inválido para atualização de estoque: ${id}`);
      return null;
    }
  
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      console.log(`[ProductModel] Atualizando estoque do produto ${id} com alteração: ${stockChange}`);
      
      // 1. Buscar o produto com sessão ativa
      const product = await Product.findById(id).session(session);
      if (!product) {
        throw new Error(`Produto não encontrado: ${id}`);
      }
  
      // 2. Calcular novo estoque
      const currentStock = product.stock ?? 0;
      const newStock = currentStock + stockChange;
      
      if (newStock < 0) {
        throw new Error(`Estoque não pode ficar negativo (tentativa: ${newStock})`);
      }
  
      // 3. Atualização direta com verificação
      const updated = await Product.updateOne(
        { _id: id },
        { $set: { stock: newStock } },
        { session }
      );
  
      if (updated.modifiedCount !== 1) {
        throw new Error('Nenhum documento foi modificado');
      }
  
      // 4. Buscar novamente para verificar
      const verifiedProduct = await Product.findById(id).session(session);
      if (verifiedProduct?.stock !== newStock) {
        throw new Error(`Discrepância no estoque após atualização. Esperado: ${newStock}, Obtido: ${verifiedProduct?.stock}`);
      }
  
      await session.commitTransaction();
      console.log(`[ProductModel] Estoque atualizado com sucesso para: ${newStock}`);
      return this.convertToIProduct(verifiedProduct);
    } catch (error) {
      await session.abortTransaction();
      console.error(`[ProductModel] Erro na transação:`, error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async delete(id: string): Promise<IProduct | null> {
    if (!this.isValidId(id)) return null;

    const product = await Product.findByIdAndDelete(id);
    if (!product) return null;
    return this.convertToIProduct(product);
  }
}