import { Product } from "../schemas/ProductSchema";
import type { IProduct, ICreateProductDTO } from "../interfaces/IProduct";
import { type Document, Types, type FilterQuery } from "mongoose";

interface ProductDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  category: string;
  description: string;
  image?: string | null; // Aceita string, null ou undefined
  brand: string;
  modelGlasses: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(productData: ICreateProductDTO): Promise<IProduct> {
    const product = new Product(productData);
    const savedProduct = (await product.save()) as ProductDocument;
    return this.convertToIProduct(savedProduct);
  }

  async findByName(name: string): Promise<IProduct | null> {
    const product = (await Product.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    })) as ProductDocument | null;
    return product ? this.convertToIProduct(product) : null;
  }

  async findById(id: string): Promise<IProduct | null> {
    if (!this.isValidId(id)) return null;
    const product = (await Product.findById(id)) as ProductDocument | null;
    return product ? this.convertToIProduct(product) : null;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Partial<ICreateProductDTO> = {}
  ): Promise<{ products: IProduct[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as FilterQuery<ProductDocument>);

    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit) as Promise<ProductDocument[]>,
      Product.countDocuments(query),
    ]);

    return {
      products: products.map((product) => this.convertToIProduct(product)),
      total,
    };
  }

  async update(
    id: string,
    productData: Partial<ICreateProductDTO>
  ): Promise<IProduct | null> {
    if (!this.isValidId(id)) return null;

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: productData },
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

  async updateStock(id: string, quantity: number): Promise<IProduct | null> {
    if (!this.isValidId(id)) return null;

    const product = (await Product.findByIdAndUpdate(
      id,
      { $inc: { stock: quantity } },
      { new: true, runValidators: true }
    )) as ProductDocument | null;

    return product ? this.convertToIProduct(product) : null;
  }

  private convertToIProduct(doc: ProductDocument): IProduct {
    return {
      _id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      image: doc.image || undefined, // Converte null para undefined
      brand: doc.brand,
      modelGlasses: doc.modelGlasses,
      price: doc.price,
      stock: doc.stock,
      category: doc.category,
    };
  }
}
