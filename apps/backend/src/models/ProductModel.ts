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
          reference: rawDoc.reference
        } as IPrescriptionFrame;
      
      case 'sunglasses_frame':
        return {
          ...baseProduct,
          modelSunglasses: rawDoc.modelSunglasses || rawDoc.model,
          typeFrame: rawDoc.typeFrame,
          color: rawDoc.color,
          shape: rawDoc.shape,
          reference: rawDoc.reference
        } as ISunglassesFrame;
      
      default:
        return baseProduct;
    }
  }

  async create(productData: Omit<IProduct, "_id">): Promise<IProduct> {
    let dataToSave = { ...productData };
    
    if (productData.productType === 'sunglasses_frame' && 'modelSunglasses' in productData) {
      // @ts-ignore - ignorar erro de tipo
      dataToSave.modelGlasses = productData.modelSunglasses;
    }
    
    let savedProduct;
    
    switch (productData.productType) {
      case 'lenses':
        savedProduct = await new Lens(dataToSave).save();
        break;
      case 'clean_lenses':
        savedProduct = await new CleanLens(dataToSave).save();
        break;
      case 'prescription_frame':
        savedProduct = await new PrescriptionFrame(dataToSave).save();
        break;
      case 'sunglasses_frame':
        savedProduct = await new SunglassesFrame(dataToSave).save();
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
}