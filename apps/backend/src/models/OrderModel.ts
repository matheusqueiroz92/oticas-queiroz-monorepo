import { Order } from "../schemas/OrderSchema";
import type { IOrder } from "../interfaces/IOrder";
import { Types, type FilterQuery } from "mongoose";

export class OrderModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  // Função para converter os dados do pedido
  private convertToIOrder(doc: any): IOrder {
    const order = doc.toObject ? doc.toObject() : doc;

    return {
      _id: order._id.toString(),
      clientId: order.clientId ? order.clientId.toString() : null, // Garantir que seja uma string
      employeeId: order.employeeId ? order.employeeId.toString() : null, // Garantir que seja uma string
      laboratoryId: order.laboratoryId ? order.laboratoryId.toString() : undefined, // Caso tenha laboratório
      product: Array.isArray(order.product)
        ? order.product.map((p: any) => ({
            _id: p._id.toString(),
            name: p.name,
            productType: p.productType,
            description: p.description,
            image: p.image,
            sellPrice: p.sellPrice,
            brand: p.brand,
            costPrice: p.costPrice,
            // Campos específicos do tipo de produto
            ...(p.productType === "lenses" && { lensType: p.lensType }),
            ...(p.productType === "prescription_frame" && {
              typeFrame: p.typeFrame,
              color: p.color,
              shape: p.shape,
              reference: p.reference,
            }),
            ...(p.productType === "sunglasses_frame" && {
              model: p.model,
              typeFrame: p.typeFrame,
              color: p.color,
              shape: p.shape,
              reference: p.reference,
            }),
          }))
        : [],
      paymentMethod: order.paymentMethod,
      paymentEntry: order.paymentEntry,
      installments: order.installments,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      status: order.status,
      observations: order.observations,
      totalPrice: order.totalPrice,
      discount: order.discount || 0,
      finalPrice: order.finalPrice,
      isDeleted: order.isDeleted,
      deletedAt: order.deletedAt,
      deletedBy: order.deletedBy ? order.deletedBy.toString() : undefined,
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

    // Se não devemos incluir pedidos excluídos, adicionar a condição
    if (!includeDeleted) {
      query = query.where({ isDeleted: { $ne: true } });
    }

    if (populate) {
      query = query
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId", "name")
        .populate("product", "name productType description price");

      if (includeDeleted) {
        query = query.populate("deletedBy", "name email");
      }
    }

    const order = await query.exec();
    
    // Verifique os dados populados de 'clientId' e 'employeeId'
    console.log(order?.clientId); // Verifica o que está sendo retornado após o populate
    console.log(order?.employeeId); // Verifica o que está sendo retornado após o populate
    
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
        .populate("laboratoryId", "name")
        .populate("product", "name productType description price");

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

    let query = Order.findByIdAndUpdate(
      id,
      { $set: orderData },
      { new: true, runValidators: true }
    );

    if (populate) {
      query = query
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId", "name")
        .populate("product", "name productType description price");
    }

    const order = await query.exec();
    return order ? this.convertToIOrder(order) : null;
  }

  async delete(id: string): Promise<IOrder | null> {
    if (!this.isValidId(id)) return null;

    const order = await Order.findByIdAndDelete(id);
    return order ? this.convertToIOrder(order) : null;
  }

  // Método para buscar pedidos por período de data
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
        .populate("laboratoryId", "name")
        .populate("product", "name productType description price");

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
