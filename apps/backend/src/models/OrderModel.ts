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
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered";
  laboratoryId?: Types.ObjectId;
  prescriptionData?: {
    doctorName: string;
    clinicName: string;
    appointmentDate: Date;
    leftEye: {
      near: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
      far: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
    };
    rightEye: {
      near: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
      far: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
    };
  };
  lensType?: string;
  observations?: string;
  totalPrice: number;
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

  async findById(id: string, populate = false): Promise<IOrder | null> {
    if (!this.isValidId(id)) return null;

    let query = Order.findById(id);

    if (populate) {
      query = query
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        // .populate("products", "name description price category")
        .populate("laboratoryId");
    }

    const order = (await query.exec()) as OrderDocument | null;
    return order ? this.convertToIOrder(order) : null;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Partial<IOrder> = {},
    populate = false
  ): Promise<{ orders: IOrder[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as FilterQuery<OrderDocument>);

    let orderQuery = Order.find(query).skip(skip).limit(limit);

    if (populate) {
      orderQuery = orderQuery
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        // .populate("products", "name description price category")
        .populate("laboratoryId");
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
        // .populate("products", "name description price category")
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

  async findByClientId(clientId: string, populate = false): Promise<IOrder[]> {
    if (!this.isValidId(clientId)) return [];

    let query = Order.find({ clientId });

    if (populate) {
      query = query
        .populate("clientId", "name email role")
        .populate("employeeId", "name email")
        // .populate("products", "name description price category")
        .populate("laboratoryId");
    }

    const orders = (await query.exec()) as unknown as OrderDocument[];
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

  private convertToIOrder(doc: OrderDocument): IOrder {
    const order = doc.toObject();
    return {
      ...order,
      _id: doc._id.toString(),
      clientId: doc.clientId ? doc.clientId.toString() : null,
      employeeId: doc.employeeId ? doc.employeeId.toString() : null,
      laboratoryId: doc.laboratoryId ? doc.laboratoryId.toString() : undefined,
    };
  }
}
