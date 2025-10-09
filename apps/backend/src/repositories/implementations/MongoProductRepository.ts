import { Product, PrescriptionFrame, SunglassesFrame, Lens, CleanLens } from "../../schemas/ProductSchema";
import { BaseRepository } from "./BaseRepository";
import { IProductRepository } from "../interfaces/IProductRepository";
import type { IProduct } from "../../interfaces/IProduct";
import { Types } from "mongoose";

/**
 * Implementação do ProductRepository para MongoDB
 */
export class MongoProductRepository extends BaseRepository<IProduct, Omit<IProduct, "_id">> implements IProductRepository {
  constructor() {
    super(Product);
  }

  /**
   * Sobrescreve o método create para usar o discriminator correto baseado em productType
   */
  async create(data: Omit<IProduct, "_id">): Promise<IProduct> {
    try {
      // Determinar qual modelo usar baseado no productType
      let model;
      switch (data.productType) {
        case 'lenses':
          model = Lens;
          break;
        case 'clean_lenses':
          model = CleanLens;
          break;
        case 'prescription_frame':
          model = PrescriptionFrame;
          break;
        case 'sunglasses_frame':
          model = SunglassesFrame;
          break;
        default:
          throw new Error(`Tipo de produto inválido: ${data.productType}`);
      }

      // Criar o documento usando o modelo discriminator correto
      const doc = await model.create(data);
      return this.convertToInterface(doc);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  /**
   * Sobrescreve o método update para garantir que não alteramos o productType
   */
  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      // Buscar o produto existente para determinar o tipo
      const existingProduct = await this.model.findById(id).exec();
      if (!existingProduct) {
        return null;
      }

      // Determinar qual modelo usar baseado no productType do produto existente
      let targetModel;
      switch (existingProduct.productType) {
        case 'lenses':
          targetModel = Lens;
          break;
        case 'clean_lenses':
          targetModel = CleanLens;
          break;
        case 'prescription_frame':
          targetModel = PrescriptionFrame;
          break;
        case 'sunglasses_frame':
          targetModel = SunglassesFrame;
          break;
        default:
          targetModel = this.model;
      }

      // Remover productType do update para evitar mudança de tipo
      const { productType, ...updateData } = data as any;

      const doc = await targetModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao atualizar produto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Converte documento do MongoDB para IProduct
   */
  protected convertToInterface(doc: any): IProduct {
    if (!doc) {
      throw new Error("Documento não pode ser nulo");
    }

    const product = doc.toObject ? doc.toObject() : doc;

    return {
      _id: product._id?.toString() || "",
      name: product.name || "",
      productType: product.productType || "lenses",
      image: product.image,
      sellPrice: product.sellPrice || 0,
      description: product.description,
      brand: product.brand,
      costPrice: product.costPrice,
      stock: product.stock,
      // Propriedades específicas de lentes
      lensType: product.lensType,
      // Propriedades específicas de armações
      typeFrame: product.typeFrame,
      color: product.color,
      shape: product.shape,
      reference: product.reference,
      modelSunglasses: product.modelSunglasses,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    } as IProduct;
  }

  /**
   * Constrói query de filtros específica para produtos
   */
  protected buildFilterQuery(filters: Record<string, any>): Record<string, any> {
    const query = super.buildFilterQuery(filters);

    // Filtros específicos para produtos
    if (filters.productType) {
      query.productType = filters.productType;
    }

    if (filters.brand) {
      query.brand = new RegExp(filters.brand, 'i');
    }

    if (filters.name) {
      query.name = new RegExp(filters.name, 'i');
    }

    if (filters.lensType) {
      query.lensType = filters.lensType;
    }

    if (filters.typeFrame) {
      query.typeFrame = filters.typeFrame;
    }

    if (filters.color) {
      query.color = new RegExp(filters.color, 'i');
    }

    if (filters.shape) {
      query.shape = new RegExp(filters.shape, 'i');
    }

    if (filters.reference) {
      query.reference = new RegExp(filters.reference, 'i');
    }

    if (filters.modelSunglasses) {
      query.modelSunglasses = new RegExp(filters.modelSunglasses, 'i');
    }

    // Filtros por preço
    if (filters.minPrice !== undefined) {
      query.sellPrice = { ...query.sellPrice, $gte: filters.minPrice };
    }

    if (filters.maxPrice !== undefined) {
      query.sellPrice = { ...query.sellPrice, $lte: filters.maxPrice };
    }

    // Filtros por estoque
    if (filters.minStock !== undefined) {
      query.stock = { ...query.stock, $gte: filters.minStock };
    }

    if (filters.maxStock !== undefined) {
      query.stock = { ...query.stock, $lte: filters.maxStock };
    }

    // Filtro para produtos com estoque baixo
    if (filters.lowStock === true) {
      query.stock = { ...query.stock, $lte: 10 };
    }

    // Filtro para produtos sem estoque
    if (filters.outOfStock === true) {
      query.stock = { ...query.stock, $lte: 0 };
    }

    return query;
  }

  /**
   * Busca produtos por tipo
   */
  async findByType(
    productType: IProduct["productType"],
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { productType });
  }

  /**
   * Busca produtos por marca
   */
  async findByBrand(
    brand: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { brand });
  }

  /**
   * Busca produtos por nome (busca parcial)
   */
  async findByName(
    name: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { name });
  }

  /**
   * Busca produtos com estoque baixo
   */
  async findLowStock(
    threshold: number = 10,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      
      const query = {
        stock: { $lte: threshold },
        productType: { $in: ["prescription_frame", "sunglasses_frame"] } // Apenas produtos com estoque
      };

      const [docs, total] = await Promise.all([
        this.model.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ stock: 1, name: 1 })
          .exec(),
        this.model.countDocuments(query).exec()
      ]);

      const items = docs.map(doc => this.convertToInterface(doc));

      return {
        items,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error);
      throw error;
    }
  }

  /**
   * Busca produtos mais vendidos
   */
  async findBestSelling(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{ product: IProduct; totalSold: number }>> {
    try {
      // Esta implementação requer uma agregação com OrderItems
      // Por ora, retornamos produtos ordenados por ID como placeholder
      const docs = await this.model.find({})
        .limit(limit)
        .sort({ _id: -1 })
        .exec();

      return docs.map(doc => ({
        product: this.convertToInterface(doc),
        totalSold: 0 // Placeholder - implementar agregação real com OrderItems
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
      throw error;
    }
  }

  /**
   * Busca produtos por faixa de preço
   */
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { minPrice, maxPrice });
  }



  /**
   * Atualiza estoque de um produto
   */
  async updateStock(
    id: string,
    quantity: number,
    operation: "add" | "subtract" | "set" = "set",
    session?: any
  ): Promise<IProduct | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      // Primeiro, buscar o produto para determinar o tipo
      const existingProduct = await this.model.findById(id).exec();
      if (!existingProduct) {
        return null;
      }

      // Escolher o modelo correto baseado no tipo
      let targetModel = this.model;
      if (existingProduct.productType === 'prescription_frame') {
        targetModel = PrescriptionFrame;
      } else if (existingProduct.productType === 'sunglasses_frame') {
        targetModel = SunglassesFrame;
      }

      let updateQuery: any = {};

      switch (operation) {
        case "add":
          updateQuery = { $inc: { stock: Math.abs(quantity) } };
          break;
        case "subtract":
          updateQuery = { $inc: { stock: -Math.abs(quantity) } };
          break;
        case "set":
        default:
          updateQuery = { $set: { stock: Math.max(0, quantity) } };
          break;
      }

      const options: any = { new: true, runValidators: true };
      if (session) {
        options.session = session;
      }

      const doc = await targetModel.findByIdAndUpdate(
        id,
        updateQuery,
        options
      ).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao atualizar estoque do produto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca produtos com estoque insuficiente para uma quantidade específica
   */
  async findInsufficientStock(
    productIds: string[],
    requiredQuantities: number[]
  ): Promise<{ productId: string; available: number; required: number }[]> {
    try {
      if (productIds.length !== requiredQuantities.length) {
        throw new Error("Arrays de IDs e quantidades devem ter o mesmo tamanho");
      }

      const objectIds = productIds
        .filter(id => this.isValidId(id))
        .map(id => new Types.ObjectId(id));

      const docs = await this.model.find({
        _id: { $in: objectIds },
        productType: { $in: ["prescription_frame", "sunglasses_frame"] }
      }).exec();

      const insufficientStock: { productId: string; available: number; required: number }[] = [];

      productIds.forEach((productId, index) => {
        const doc = docs.find(d => d._id.toString() === productId);
        const required = requiredQuantities[index];
        
        if (doc) {
          const available = (doc as any).stock || 0;
          if (available < required) {
            insufficientStock.push({
              productId,
              available,
              required
            });
          }
        } else {
          insufficientStock.push({
            productId,
            available: 0,
            required
          });
        }
      });

      return insufficientStock;
    } catch (error) {
      console.error('Erro ao verificar estoque insuficiente:', error);
      throw error;
    }
  }

  /**
   * Busca produtos por múltiplos IDs
   */
  async findByIds(ids: string[]): Promise<IProduct[]> {
    try {
      const objectIds = ids
        .filter(id => this.isValidId(id))
        .map(id => new Types.ObjectId(id));

      if (objectIds.length === 0) {
        return [];
      }

      const docs = await this.model.find({
        _id: { $in: objectIds }
      }).exec();

      return docs.map(doc => this.convertToInterface(doc));
    } catch (error) {
      console.error('Erro ao buscar produtos por IDs:', error);
      throw error;
    }
  }

  /**
   * Busca produtos por termo de pesquisa
   */
  async search(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      
      const query = {
        $or: [
          { name: new RegExp(searchTerm, 'i') },
          { description: new RegExp(searchTerm, 'i') },
          { brand: new RegExp(searchTerm, 'i') }
        ]
      };

      const [docs, total] = await Promise.all([
        this.model.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ name: 1 })
          .exec(),
        this.model.countDocuments(query).exec()
      ]);

      const items = docs.map(doc => this.convertToInterface(doc));

      return {
        items,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Erro ao buscar produtos por termo:', error);
      throw error;
    }
  }

  /**
   * Calcula estatísticas de produtos
   */
  async getProductStats(): Promise<{
    totalProducts: number;
    productsByType: Record<IProduct["productType"], number>;
    totalStockValue: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  }> {
    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            productsByType: {
              $push: "$productType"
            },
            lowStockCount: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $in: ["$productType", ["prescription_frame", "sunglasses_frame"]] },
                      { $lte: ["$stock", 10] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            outOfStockCount: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $in: ["$productType", ["prescription_frame", "sunglasses_frame"]] },
                      { $lte: ["$stock", 0] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            averagePrice: { $avg: "$sellPrice" },
            totalStockValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$stock", 0] },
                  { $ifNull: ["$costPrice", "$sellPrice"] }
                ]
              }
            }
          }
        }
      ];

      const results = await this.model.aggregate(pipeline).exec();

      if (results.length === 0) {
        return {
          totalProducts: 0,
          productsByType: {
            lenses: 0,
            clean_lenses: 0,
            prescription_frame: 0,
            sunglasses_frame: 0
          },
          totalStockValue: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0
        };
      }

      const result = results[0];

      // Processar contagem por tipo
      const productsByType = {
        lenses: 0,
        clean_lenses: 0,
        prescription_frame: 0,
        sunglasses_frame: 0
      };

      if (Array.isArray(result.productsByType)) {
        result.productsByType.forEach((type: string) => {
          if (type in productsByType) {
            productsByType[type as IProduct["productType"]]++;
          }
        });
      }

      return {
        totalProducts: result.totalProducts || 0,
        productsByType,
        totalStockValue: result.totalStockValue || 0,
        lowStockProducts: result.lowStockCount || 0,
        outOfStockProducts: result.outOfStockCount || 0
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas de produtos:', error);
      throw error;
    }
  }

  /**
   * Busca produtos sem estoque
   */
  async findOutOfStock(
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { stock: 0, hasStock: true });
  }

  /**
   * Busca produtos de lentes por tipo
   */
  async findLensesByType(
    lensType: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    const query = {
      productType: { $in: ["lenses", "clean_lenses"] },
      lensType
    };

    return this.findAll(page, limit, query);
  }

  /**
   * Busca armações por características
   */
  async findFramesByFilters(
    filters: {
      typeFrame?: string;
      color?: string;
      shape?: string;
      reference?: string;
      modelSunglasses?: string;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    const query = {
      ...filters,
      productType: { $in: ["prescription_frame", "sunglasses_frame"] }
    };

    return this.findAll(page, limit, query);
  }

  /**
   * Aumenta estoque de um produto
   */
  async increaseStock(id: string, quantity: number): Promise<IProduct | null> {
    return this.updateStock(id, quantity, "add");
  }

  /**
   * Diminui estoque de um produto
   */
  async decreaseStock(id: string, quantity: number): Promise<IProduct | null> {
    return this.updateStock(id, quantity, "subtract");
  }

  /**
   * Atualiza preço de venda de um produto
   */
  async updateSellPrice(id: string, sellPrice: number): Promise<IProduct | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findByIdAndUpdate(
        id,
        { $set: { sellPrice } },
        { new: true, runValidators: true }
      ).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao atualizar preço de venda do produto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza preço de custo de um produto
   */
  async updateCostPrice(id: string, costPrice: number): Promise<IProduct | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findByIdAndUpdate(
        id,
        { $set: { costPrice } },
        { new: true, runValidators: true }
      ).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao atualizar preço de custo do produto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca produtos deletados
   */
  async findDeleted(
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, { includeDeleted: true, isDeleted: true });
  }

  /**
   * Calcula valor total do estoque
   */
  async calculateStockValue(productType?: IProduct["productType"]): Promise<number> {
    try {
      const pipeline: any[] = [
        {
          $match: {
            isDeleted: { $ne: true },
            productType: productType ? productType : { $in: ["prescription_frame", "sunglasses_frame"] }
          }
        },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$stock", 0] },
                  { $ifNull: ["$costPrice", "$sellPrice"] }
                ]
              }
            }
          }
        }
      ];

      const results = await this.model.aggregate(pipeline).exec();
      return results.length > 0 ? results[0].totalValue || 0 : 0;
    } catch (error) {
      console.error('Erro ao calcular valor do estoque:', error);
      return 0;
    }
  }

  /**
   * Busca produtos com filtros avançados
   */
  async findWithFilters(
    filters: Record<string, any>,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IProduct[]; total: number; page: number; limit: number }> {
    return this.findAll(page, limit, filters);
  }

  /**
   * Busca produto por ID com sessão da transação
   */
  async findByIdWithSession(id: string, session: any): Promise<IProduct | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findById(id).session(session).exec();
      
      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao buscar produto por ID com sessão ${id}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza produto com sessão da transação
   */
  async updateWithSession(
    id: string,
    updateData: Partial<IProduct>,
    session: any
  ): Promise<IProduct | null> {
    try {
      if (!this.isValidId(id)) {
        return null;
      }

      const doc = await this.model.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true, session }
      ).exec();

      if (!doc) {
        return null;
      }

      return this.convertToInterface(doc);
    } catch (error) {
      console.error(`Erro ao atualizar produto com sessão ${id}:`, error);
      throw error;
    }
  }
}
