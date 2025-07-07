import { Order } from "../schemas/OrderSchema";
import type { IOrder } from "../interfaces/IOrder";
import type { IProduct, ILens, ICleanLens, IPrescriptionFrame, ISunglassesFrame } from "../interfaces/IProduct";
import mongoose, { Types, type FilterQuery } from "mongoose";
import { CounterService } from "../services/CounterService";

export class OrderModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  private isObjectWithId(product: any): boolean {
    return typeof product === 'object' && product !== null && '_id' in product;
  }

  private convertToIOrder(doc: any): IOrder {
    const order = doc.toObject ? doc.toObject() : doc;
    
    let convertedProducts: Array<string | IProduct> = [];
    
    if (Array.isArray(order.products)) {
      convertedProducts = order.products.map((product: any) => {
        if (!this.isObjectWithId(product)) {
          return product.toString();
        }
        
        const baseProduct = {
          _id: product._id.toString(),
          name: product.name || "",
          productType: product.productType as IProduct["productType"],
          description: product.description || "",
          image: product.image,
          sellPrice: product.sellPrice || 0,
          brand: product.brand,
          costPrice: product.costPrice,
          stock: typeof product.stock === 'number' ? product.stock : 
                  (product.stock ? Number(product.stock) : undefined)
        };
        
        if (product.productType === 'lenses') {
          const lensProduct: ILens = {
            ...baseProduct,
            productType: 'lenses',
            lensType: product.lensType || ""
          };
          return lensProduct;
        }
        
        if (product.productType === 'clean_lenses') {
          const cleanLensProduct: ICleanLens = {
            ...baseProduct,
            productType: 'clean_lenses'
          };
          return cleanLensProduct;
        }
        
        if (product.productType === 'prescription_frame') {
          const prescriptionFrameProduct: IPrescriptionFrame = {
            ...baseProduct,
            productType: 'prescription_frame',
            typeFrame: product.typeFrame || "",
            color: product.color || "",
            shape: product.shape || "",
            reference: product.reference || "",
            stock: typeof product.stock === 'number' ? product.stock : 
                    (product.stock ? Number(product.stock) : 0)
          };
          return prescriptionFrameProduct;
        }
        
        if (product.productType === 'sunglasses_frame') {
          const sunglassesFrameProduct: ISunglassesFrame = {
            ...baseProduct,
            productType: 'sunglasses_frame',
            modelSunglasses: product.modelSunglasses || "",
            typeFrame: product.typeFrame || "",
            color: product.color || "",
            shape: product.shape || "",
            reference: product.reference || "",
            stock: typeof product.stock === 'number' ? product.stock : 
                    (product.stock ? Number(product.stock) : 0)
          };
          return sunglassesFrameProduct;
        }
        
        return baseProduct;
      });
    }
    
    // Processamento adequado do histórico de pagamentos
    let paymentHistory = [];
    if (order.paymentHistory && Array.isArray(order.paymentHistory)) {
      paymentHistory = order.paymentHistory.map((entry: any) => {
        return {
          paymentId: entry.paymentId ? 
            (typeof entry.paymentId === 'object' && entry.paymentId._id ? 
              entry.paymentId._id.toString() : 
              entry.paymentId.toString()) : "",
          amount: typeof entry.amount === 'number' ? entry.amount : 0,
          date: entry.date instanceof Date ? entry.date : new Date(entry.date || Date.now()),
          method: entry.method || ""
        };
      });
    }
    
    return {
      _id: order._id.toString(),
      clientId: order.clientId
          ? (typeof order.clientId === 'object' && order.clientId?._id
              ? order.clientId._id.toString()
              : order.clientId.toString())
          : "",
      employeeId: order.employeeId
          ? (typeof order.employeeId === 'object' && order.employeeId?._id
              ? order.employeeId._id.toString()
              : order.employeeId.toString())
          : "",
      products: convertedProducts,
      serviceOrder: order.serviceOrder, // Agora será sempre uma string gerada automaticamente
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentEntry: order.paymentEntry,
      installments: order.installments,
      paymentHistory: paymentHistory.length > 0 ? paymentHistory : undefined,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      status: order.status,
      laboratoryId: order.laboratoryId 
          ? (typeof order.laboratoryId === 'object' && order.laboratoryId._id 
              ? order.laboratoryId._id.toString()
              : order.laboratoryId.toString())
          : undefined,
      prescriptionData: order.prescriptionData,
      observations: order.observations,
      totalPrice: order.totalPrice,
      discount: order.discount || 0,
      finalPrice: order.finalPrice,
      isDeleted: order.isDeleted,
      deletedAt: order.deletedAt,
      deletedBy: order.deletedBy 
          ? (typeof order.deletedBy === 'object' && order.deletedBy._id
              ? order.deletedBy._id.toString()
              : order.deletedBy.toString())
          : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private buildFilterQuery(filters: Record<string, any>): FilterQuery<any> {
    const query: Record<string, any> = {};

    if (filters.clientId) {
      query.clientId = new Types.ObjectId(filters.clientId);
    }

    if (filters.employeeId) {
      try {
        query.employeeId = new Types.ObjectId(filters.employeeId);
      } catch (error) {
        console.error(`Erro ao converter employeeId: ${filters.employeeId}`, error);
        query.employeeId = filters.employeeId;
      }
    }

    if (filters.serviceOrder) {
      // Agora serviceOrder é uma string direta (não precisa limpar)
      query.serviceOrder = filters.serviceOrder.toString();
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.laboratoryId) {
      query.laboratoryId = new Types.ObjectId(filters.laboratoryId);
    }

    if (filters.paymentMethod) {
      query.paymentMethod = filters.paymentMethod;
    }

    if (filters.productId) {
      query.product = { $in: [new Types.ObjectId(filters.productId)] };
    }

    if (filters.startDate || filters.endDate) {
      query.orderDate = {};

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        query.orderDate.$gte = startDate;
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.orderDate.$lte = endDate;
      }
    }

    if (filters.minPrice || filters.maxPrice) {
      query.finalPrice = {};

      if (filters.minPrice) {
        query.finalPrice.$gte = Number(filters.minPrice);
      }

      if (filters.maxPrice) {
        query.finalPrice.$lte = Number(filters.maxPrice);
      }
    }

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    return query;
  }

  private async findClientIdsBySearchTerm(searchTerm: string): Promise<string[]> {
    try {
      const UserModel = mongoose.model('User');

  

      // Primeiro, vamos ver todos os usuários que correspondem ao termo (sem filtro de role)
      const allMatchingUsers = await UserModel.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { cpf: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }).select('_id name role cpf email');

      


      // Agora filtrar apenas por customers
      const matchingClients = await UserModel.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { cpf: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ],
        role: 'customer'
      }).select('_id');

      
      
      return matchingClients.map(client => client._id.toString());
    } catch (error) {
      console.error('Erro ao buscar clientes por termo:', error);
      return [];
    }
  }
  
  async create(orderData: Omit<IOrder, "_id">): Promise<IOrder> {
    // Não precisamos mais gerar serviceOrder aqui, pois será feito automaticamente no middleware
    const order = new Order(orderData);
    const savedOrder = await order.save();
    return this.convertToIOrder(savedOrder);
  }

  // Resto dos métodos permanecem iguais...
  async findAll(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {},
    populate = false,
    includeDeleted = false
  ): Promise<{ orders: IOrder[]; total: number }> {
    const skip = (page - 1) * limit;

    const sortParam = filters.sort || "-createdAt";

    const sortObj: Record<string, 1 | -1> = {};

    sortParam.split(',').forEach((field: string) => {
      const trimmed = field.trim();
      if (trimmed.startsWith('-')) {
        sortObj[trimmed.substring(1)] = -1;
      } else {
        sortObj[trimmed] = 1;
      }
    });
    
    const queryFilters = { ...filters };
    delete queryFilters.sort;
    
    const searchTerm = queryFilters.search;
    let clientIds: string[] = [];

    if (searchTerm) {
      clientIds = await this.findClientIdsBySearchTerm(searchTerm);
      
      if (clientIds.length === 0) {
        return {
          orders: [],
          total: 0
        };
      }
      
      delete queryFilters.search;
    }
    
    const query = this.buildFilterQuery(queryFilters);
  
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    if (clientIds.length > 0) {
      query.clientId = { $in: clientIds.map(id => new Types.ObjectId(id)) };
    }
    
    let orderQuery = Order.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .collation({ locale: 'pt', strength: 2 });
      
    if (populate) {
      orderQuery = orderQuery
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId")
        .populate("products");
  
      if (includeDeleted) {
        orderQuery = orderQuery.populate("deletedBy", "name email");
      }
    }
  
    const [orders, total] = await Promise.all([
      orderQuery.exec(),
      Order.countDocuments(query),
    ]);
  
    return {
      orders: orders.map((order) => this.convertToIOrder(order)),
      total,
    };
  }

  // Método para criar com sessão (usado em transações)
  async createWithSession(
    orderData: Omit<IOrder, "_id">,
    session: mongoose.ClientSession
  ): Promise<IOrder> {
    try {
      // Gerar o serviceOrder usando a sessão para manter consistência
      if (!orderData.serviceOrder) {
        const nextNumber = await CounterService.getNextSequenceWithSession('serviceOrder', session);
        orderData.serviceOrder = nextNumber.toString();
      }
  
      const order = new Order(orderData);
      const savedOrder = await order.save({ session });
      return this.convertToIOrder(savedOrder);
    } catch (error) {
      console.error('Erro ao criar pedido com sessão:', error);
      throw error;
    }
  }

  // Outros métodos continuam iguais...
  async findById(
    id: string,
    populate = false,
    includeDeleted = false
  ): Promise<IOrder | null> {
    if (!this.isValidId(id)) return null;
  
    let query = Order.findById(id);
  
    if (!includeDeleted) {
      query = query.where({ isDeleted: { $ne: true } });
    }
  
    if (populate) {
      query = query
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId")
        .populate("products");
  
      if (includeDeleted) {
        query = query.populate("deletedBy", "name email");
      }
    }
  
    const order = await query.exec();
    return order ? this.convertToIOrder(order) : null;
  }

  async update(
    id: string,
    orderData: Partial<IOrder>,
    populate = false
  ): Promise<IOrder | null> {
    if (!this.isValidId(id)) return null;
  
    if (orderData.paymentHistory) {
      const currentOrder = await Order.findById(id);
      if (currentOrder) {
        orderData.paymentHistory = orderData.paymentHistory.map(entry => ({
          paymentId: entry.paymentId,
          amount: Number(entry.amount),
          date: entry.date instanceof Date ? entry.date : new Date(entry.date),
          method: entry.method
        }));
      }
    }
  
    if (orderData.totalPrice !== undefined || orderData.discount !== undefined) {
      const currentOrder = await Order.findById(id);
      if (currentOrder) {
        const newTotalPrice = orderData.totalPrice ?? currentOrder.totalPrice;
        const newDiscount = orderData.discount ?? currentOrder.discount;
        orderData.finalPrice = newTotalPrice - newDiscount;
      }
    }
  
    let query = Order.findByIdAndUpdate(
      id,
      { $set: orderData },
      { new: true, runValidators: true }
    );
  
    if (populate) {
      query = query
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId")
        .populate("products");
    }
  
    const order = await query.exec();
    return order ? this.convertToIOrder(order) : null;
  }

  async delete(id: string): Promise<IOrder | null> {
    if (!this.isValidId(id)) return null;

    const order = await Order.findByIdAndDelete(id);
    return order ? this.convertToIOrder(order) : null;
  }

  async softDelete(id: string, userId: string): Promise<IOrder | null> {
    if (!this.isValidId(id)) return null;

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate("clientId", "name email role")
      .populate("employeeId", "name email")
      .populate("laboratoryId")
      .populate("products")
      .populate("deletedBy", "name email")
      .exec();

    return order ? this.convertToIOrder(order) : null;
  }

  async findDeletedOrders(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {}
  ): Promise<{ orders: IOrder[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.buildFilterQuery(filters);
    query.isDeleted = true;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(limit)
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId")
        .populate("products")
        .populate("deletedBy", "name email")
        .exec(),
      Order.countDocuments(query),
    ]);

    return {
      orders: orders.map((order) => this.convertToIOrder(order)),
      total,
    };
  }

  async findByClientId(
    clientId: string,
    populate = false,
    includeDeleted = false
  ): Promise<IOrder[]> {
    if (!this.isValidId(clientId)) return [];

    const query: FilterQuery<any> = { clientId };

    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    let orderQuery = Order.find(query);

    if (populate) {
      orderQuery = orderQuery
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId")
        .populate("products");

      if (includeDeleted) {
        orderQuery = orderQuery.populate("deletedBy", "name email");
      }
    }

    const orders = await orderQuery.exec();
    return orders.map((order) => this.convertToIOrder(order));
  }

  async updateStatus(
    id: string,
    status: IOrder["status"],
    populate = false
  ): Promise<IOrder | null> {
    return this.update(id, { status }, populate);
  }

  async updateLaboratory(
    id: string,
    laboratoryId: IOrder["laboratoryId"],
    populate = false
  ): Promise<IOrder | null> {
    return this.update(id, { laboratoryId }, populate);
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    populate = false,
    includeDeleted = false
  ): Promise<IOrder[]> {
    const query: FilterQuery<any> = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    let orderQuery = Order.find(query);

    if (populate) {
      orderQuery = orderQuery
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId")
        .populate("products");

      if (includeDeleted) {
        orderQuery = orderQuery.populate("deletedBy", "name email");
      }
    }

    const orders = await orderQuery.exec();
    return orders.map((order) => this.convertToIOrder(order));
  }

  async findByServiceOrder(
    serviceOrder: string,
    populate = false,
    includeDeleted = false
  ): Promise<IOrder[]> {
    const query: FilterQuery<any> = { 
      serviceOrder: serviceOrder.toString() // Busca direta pela string
    };
  
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
  
    let orderQuery = Order.find(query);
  
    if (populate) {
      orderQuery = orderQuery
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId")
        .populate("products");
  
      if (includeDeleted) {
        orderQuery = orderQuery.populate("deletedBy", "name email");
      }
    }
  
    const orders = await orderQuery.exec();
    return orders.map((order) => this.convertToIOrder(order));
  }
}