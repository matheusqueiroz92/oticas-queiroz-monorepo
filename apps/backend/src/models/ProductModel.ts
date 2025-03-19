// apps/backend/src/models/ProductModel.ts
import { Types, FilterQuery } from "mongoose";
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
  ProductType
} from "../interfaces/IProduct";

export class ProductModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(productData: any): Promise<IProduct> {
    let savedProduct;
    
    // Criar o produto usando o modelo apropriado
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

    // Usando Promise.all
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
    
    // Não permitimos alterar o tipo de produto
    const updateData = { ...productData };
    if (updateData.productType) {
      delete updateData.productType;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) return null;
    return this.convertToIProduct(product);
  }

  async delete(id: string): Promise<IProduct | null> {
    if (!this.isValidId(id)) return null;

    const product = await Product.findByIdAndDelete(id);
    if (!product) return null;
    return this.convertToIProduct(product);
  }

  private convertToIProduct(doc: any): IProduct {
    // Obter valores brutos do documento MongoDB
    const rawDoc = doc.toObject ? doc.toObject() : doc;
    
    // Preparar o produto base
    const baseProduct: IProduct = {
      _id: rawDoc._id.toString(),
      productType: rawDoc.productType,
      name: rawDoc.name,
      description: rawDoc.description,
      sellPrice: rawDoc.sellPrice,
      image: rawDoc.image,
      brand: rawDoc.brand,
      costPrice: rawDoc.costPrice,
      createdAt: rawDoc.createdAt,
      updatedAt: rawDoc.updatedAt
    };

    // Adicionar campos específicos com base no tipo
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
          reference: rawDoc.reference
        } as IPrescriptionFrame;
      
      case 'sunglasses_frame':
        return {
          ...baseProduct,
          modelSunglasses: rawDoc.model,
          typeFrame: rawDoc.typeFrame,
          color: rawDoc.color,
          shape: rawDoc.shape,
          reference: rawDoc.reference
        } as ISunglassesFrame;
      
      default:
        return baseProduct;
    }
  }
}