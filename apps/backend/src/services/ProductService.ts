import { ProductModel } from "../models/ProductModel";
import type { IProduct, ICreateProductDTO } from "../interfaces/IProduct";

export class ProductError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductError";
  }
}

export class ProductService {
  private productModel: ProductModel;

  constructor() {
    this.productModel = new ProductModel();
  }

  private validateProductData(productData: ICreateProductDTO): void {
    if (productData.price < 0) {
      throw new ProductError("Preço não pode ser negativo");
    }
    if (productData.stock < 0) {
      throw new ProductError("Estoque não pode ser negativo");
    }
    if (!productData.name?.trim()) {
      throw new ProductError("Nome do produto é obrigatório");
    }
    // Adicione mais validações conforme necessário
  }

  async createProduct(productData: ICreateProductDTO): Promise<IProduct> {
    this.validateProductData(productData);

    const existingProduct = await this.productModel.findByName(
      productData.name
    );
    if (existingProduct) {
      throw new ProductError("Produto já cadastrado com este nome");
    }

    return this.productModel.create(productData);
  }

  async getAllProducts(
    page?: number,
    limit?: number,
    filters?: Partial<ICreateProductDTO>
  ): Promise<{ products: IProduct[]; total: number }> {
    const result = await this.productModel.findAll(page, limit, filters);
    if (!result.products.length) {
      throw new ProductError("Nenhum produto encontrado");
    }
    return result;
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new ProductError("Produto não encontrado");
    }
    return product;
  }

  async updateProduct(
    id: string,
    productData: Partial<ICreateProductDTO>
  ): Promise<IProduct> {
    if (productData.price !== undefined && productData.price < 0) {
      throw new ProductError("Preço não pode ser negativo");
    }
    if (productData.stock !== undefined && productData.stock < 0) {
      throw new ProductError("Estoque não pode ser negativo");
    }

    if (productData.name) {
      const existingProduct = await this.productModel.findByName(
        productData.name
      );
      if (existingProduct && existingProduct._id !== id) {
        throw new ProductError("Já existe um produto com este nome");
      }
    }

    const product = await this.productModel.update(id, productData);
    if (!product) {
      throw new ProductError("Produto não encontrado");
    }

    return product;
  }

  async deleteProduct(id: string): Promise<IProduct> {
    const product = await this.productModel.delete(id);
    if (!product) {
      throw new ProductError("Produto não encontrado");
    }
    return product;
  }

  async updateStock(id: string, quantity: number): Promise<IProduct> {
    const product = await this.getProductById(id);

    if (product.stock + quantity < 0) {
      throw new ProductError("Estoque insuficiente");
    }

    const updatedProduct = await this.productModel.updateStock(id, quantity);
    if (!updatedProduct) {
      throw new ProductError("Erro ao atualizar estoque");
    }

    return updatedProduct;
  }
}
