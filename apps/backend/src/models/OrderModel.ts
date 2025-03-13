import { Order } from "../schemas/OrderSchema";
import type { IOrder } from "../interfaces/IOrder";
import { type Document, Types, type FilterQuery } from "mongoose";

interface OrderDocument extends Document {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  employeeId: Types.ObjectId;
  productType: "glasses" | "lensCleaner";
  product: string;
  glassesType: "prescription" | "sunglasses";
  glassesFrame: "with" | "no";
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  orderDate: Date;
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  laboratoryId?: Types.ObjectId;
  prescriptionData?: {
    doctorName: string;
    clinicName: string;
    appointmentDate: Date;
    leftEye: {
      sph: number;
      cyl: number;
      axis: number;
    };
    rightEye: {
      sph: number;
      cyl: number;
      axis: number;
    };
    nd: number;
    oc: number;
    addition: number;
  };
  lensType?: string;
  observations?: string;
  totalPrice: number;
  // Campos para soft delete
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(orderData: Omit<IOrder, "_id">): Promise<IOrder> {
    const order = new Order(orderData);
    const savedOrder = (await order.save()) as unknown as OrderDocument;
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
        .populate("laboratoryId");

      if (includeDeleted) {
        query = query.populate("deletedBy", "name email");
      }
    }

    const order = (await query.exec()) as OrderDocument | null;
    return order ? this.convertToIOrder(order) : null;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Partial<IOrder> = {},
    populate = false,
    includeDeleted = false
  ): Promise<{ orders: IOrder[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as FilterQuery<OrderDocument>);

    // Se não devemos incluir pedidos excluídos, adicionar a condição
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    let orderQuery = Order.find(query).skip(skip).limit(limit);

    if (populate) {
      orderQuery = orderQuery
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId");

      if (includeDeleted) {
        orderQuery = orderQuery.populate("deletedBy", "name email");
      }
    }

    const [orders, total] = await Promise.all([
      orderQuery.exec() as unknown as Promise<OrderDocument[]>,
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
        .populate("laboratoryId");
    }

    const order = (await query.exec()) as OrderDocument | null;
    return order ? this.convertToIOrder(order) : null;
  }

  async delete(id: string): Promise<IOrder | null> {
    if (!this.isValidId(id)) return null;

    const order = (await Order.findByIdAndDelete(id)) as OrderDocument | null;
    return order ? this.convertToIOrder(order) : null;
  }

  /**
   * Realiza a exclusão lógica (soft delete) de um pedido
   * @param id ID do pedido
   * @param userId ID do usuário que está excluindo
   * @returns Pedido marcado como excluído ou null se não encontrado
   */
  async softDelete(id: string, userId: string): Promise<IOrder | null> {
    if (!this.isValidId(id)) return null;

    const order = (await Order.findByIdAndUpdate(
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
      .populate("deletedBy", "name email")
      .exec()) as OrderDocument | null;

    return order ? this.convertToIOrder(order) : null;
  }

  /**
   * Recupera pedidos que foram excluídos logicamente
   * @param page Número da página
   * @param limit Limite de itens por página
   * @param filters Filtros adicionais
   * @returns Lista de pedidos excluídos logicamente e total
   */
  async findDeletedOrders(
    page = 1,
    limit = 10,
    filters: Partial<IOrder> = {}
  ): Promise<{ orders: IOrder[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      },
      { isDeleted: true } as FilterQuery<OrderDocument>
    );

    const [orders, total] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(limit)
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId")
        .populate("deletedBy", "name email")
        .exec() as unknown as Promise<OrderDocument[]>,
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

    const query: FilterQuery<OrderDocument> = { clientId };

    // Se não devemos incluir pedidos excluídos, adicionar a condição
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }

    let orderQuery = Order.find(query);

    if (populate) {
      orderQuery = orderQuery
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        .populate("laboratoryId");

      if (includeDeleted) {
        orderQuery = orderQuery.populate("deletedBy", "name email");
      }
    }

    const orders = (await orderQuery.exec()) as unknown as OrderDocument[];
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

  // Método para buscar pedidos por período de data
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    populate = false,
    includeDeleted = false
  ): Promise<IOrder[]> {
    const query: FilterQuery<OrderDocument> = {
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
        .populate("laboratoryId");

      if (includeDeleted) {
        orderQuery = orderQuery.populate("deletedBy", "name email");
      }
    }

    const orders = (await orderQuery.exec()) as unknown as OrderDocument[];
    return orders.map((order) => this.convertToIOrder(order));
  }

  private convertToIOrder(doc: OrderDocument): IOrder {
    const order = doc.toObject();
    return {
      ...order,
      _id: doc._id.toString(),
      clientId: doc.clientId ? doc.clientId.toString() : null,
      employeeId: doc.employeeId ? doc.employeeId.toString() : null,
      laboratoryId: doc.laboratoryId ? doc.laboratoryId.toString() : undefined,
      deletedBy: doc.deletedBy ? doc.deletedBy.toString() : undefined,
    };
  }
}
