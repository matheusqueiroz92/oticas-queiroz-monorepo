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

  async update(
    id: string,
    productData: Partial<IProduct>
  ): Promise<IProduct | null> {
    if (!this.isValidId(id)) return null;
    
    // Adicione logs para debug
    console.log(`Atualizando produto ${id} com dados:`, JSON.stringify(productData));
    
    try {
      // Usar findOneAndUpdate com opção { new: true } para garantir que retorne o documento atualizado
      const product = await Product.findOneAndUpdate(
        { _id: id },
        { $set: productData },
        { new: true, runValidators: true }
      );
      
      if (!product) {
        console.log(`Produto não encontrado para atualização: ${id}`);
        return null;
      }
      
      console.log(`Produto atualizado com sucesso: ${id}, novo estoque: ${(product as any).stock}`);
      return this.convertToIProduct(product);
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