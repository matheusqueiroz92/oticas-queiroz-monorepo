import { Order } from "../schemas/OrderSchema";
import type { IOrder } from "../interfaces/IOrder";
import { Types, type FilterQuery } from "mongoose";

export class OrderModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  private convertToIOrder(doc: any): IOrder {
    const order = doc.toObject ? doc.toObject() : doc;
    
    return {
      _id: order._id.toString(),
      clientId: typeof order.clientId === 'object' && order.clientId?._id
        ? order.clientId._id.toString()
        : order.clientId.toString(),
      employeeId: typeof order.employeeId === 'object' && order.employeeId?._id
        ? order.employeeId._id.toString()
        : order.employeeId.toString(),
      // Convert the product array
      products: Array.isArray(order.product)
        ? order.products.map((product: any) => {
            if (typeof product === 'object' && product._id) {
              return {
                _id: product._id.toString(),
                name: product.name,
                productType: product.productType,
                description: product.description,
                image: product.image,
                sellPrice: product.sellPrice,
                brand: product.brand,
                costPrice: product.costPrice,
                // Include type-specific fields
                ...(product.productType === 'lenses' && { lensType: product.lensType }),
                ...(product.productType === 'prescription_frame' && { 
                  typeFrame: product.typeFrame,
                  color: product.color,
                  shape: product.shape,
                  reference: product.reference
                }),
                ...(product.productType === 'sunglasses_frame' && { 
                  model: product.model,
                  typeFrame: product.typeFrame,
                  color: product.color,
                  shape: product.shape,
                  reference: product.reference
                })
              };
            } else {
              return { _id: product.toString() };
            }
          })
        : [],
      paymentMethod: order.paymentMethod,
      paymentEntry: order.paymentEntry,
      installments: order.installments,
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

  async create(orderData: Omit<IOrder, "_id">): Promise<IOrder> {
    const order = new Order(orderData);
    const savedOrder = await order.save();
    return this.convertToIOrder(savedOrder);
  }

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

  async findAll(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {},
    populate = false,
    includeDeleted = false
  ): Promise<{ orders: IOrder[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.buildFilterQuery(filters);

    // Se não devemos incluir pedidos excluídos, adicionar a condição
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    let orderQuery = Order.find(query).skip(skip).limit(limit);

    if (populate) {
      orderQuery = orderQuery
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId")
        .populate("products"); // Também popula os produtos

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

  async update(
    id: string,
    orderData: Partial<IOrder>,
    populate = false
  ): Promise<IOrder | null> {
    if (!this.isValidId(id)) return null;

    // Se estamos atualizando o totalPrice ou discount, recalcular finalPrice
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
        .populate("products"); // Também popula os produtos
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

    // Se não devemos incluir pedidos excluídos, adicionar a condição
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

    // Se não devemos incluir pedidos excluídos, adicionar a condição
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

  private buildFilterQuery(filters: Record<string, any>): FilterQuery<any> {
    const query: Record<string, any> = {};

    // Cliente
    if (filters.clientId) {
      query.clientId = new Types.ObjectId(filters.clientId);
    }

    // Funcionário
    if (filters.employeeId) {
      query.employeeId = new Types.ObjectId(filters.employeeId);
    }

    // Status
    if (filters.status) {
      query.status = filters.status;
    }

    // Laboratório
    if (filters.laboratoryId) {
      query.laboratoryId = new Types.ObjectId(filters.laboratoryId);
    }

    // Produtos específicos
    if (filters.productId) {
      query.product = { $in: [new Types.ObjectId(filters.productId)] };
    }

    // Range de datas
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

    // Range de preço
    if (filters.minPrice || filters.maxPrice) {
      query.finalPrice = {};

      if (filters.minPrice) {
        query.finalPrice.$gte = Number(filters.minPrice);
      }

      if (filters.maxPrice) {
        query.finalPrice.$lte = Number(filters.maxPrice);
      }
    }

    return query;
  }
}