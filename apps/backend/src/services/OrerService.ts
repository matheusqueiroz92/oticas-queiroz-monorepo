import { Order } from "../schemas/OrderSchema";
import { User } from "../schemas/UserSchema";
import { Product } from "../schemas/ProductSchema";
import type { IOrder } from "../interfaces/IOrder";
import { type Document, Types } from "mongoose";

interface OrderDocument extends Document {
  clientId: Types.ObjectId;
  products: Types.ObjectId[];
  status: "pending" | "in_production" | "ready" | "delivered";
  laboratoryId?: Types.ObjectId;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PopulatedProduct {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface PopulatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
}

interface PopulatedOrderDocument
  extends Omit<OrderDocument, "clientId" | "products" | "laboratoryId"> {
  clientId: PopulatedUser;
  products: PopulatedProduct[];
  laboratoryId?: PopulatedUser;
}

export class OrderService {
  async createOrder(orderData: IOrder): Promise<IOrder> {
    const client = await User.findById(orderData.clientId);
    if (!client) {
      throw new Error("Cliente não encontrado");
    }

    const productPromises = orderData.products.map((productId) =>
      Product.findById(productId)
    );
    const foundProducts = await Promise.all(productPromises);

    if (foundProducts.some((product) => !product)) {
      throw new Error("Um ou mais produtos não encontrados");
    }

    const order = new Order({
      ...orderData,
      clientId: new Types.ObjectId(orderData.clientId),
      products: orderData.products.map((id) => new Types.ObjectId(id)),
    });

    const savedOrder = (await order.save()) as OrderDocument;
    return this.convertToIOrder(savedOrder);
  }

  async getAllOrders(): Promise<IOrder[]> {
    const orders = await Order.find()
      .populate<{ clientId: PopulatedUser }>("clientId", "-password")
      .populate<{ products: PopulatedProduct[] }>("products")
      .populate("laboratoryId");

    return orders.map((order) =>
      this.convertToIOrder(order as unknown as OrderDocument)
    );
  }

  async getOrderById(id: string): Promise<IOrder | null> {
    const order = await Order.findById(id)
      .populate<{ clientId: PopulatedUser }>("clientId", "-password")
      .populate<{ products: PopulatedProduct[] }>("products")
      .populate("laboratoryId");

    return order
      ? this.convertToIOrder(order as unknown as OrderDocument)
      : null;
  }

  async updateOrder(
    id: string,
    orderData: Partial<IOrder>
  ): Promise<IOrder | null> {
    if (orderData.clientId) {
      const client = await User.findById(orderData.clientId);
      if (!client) {
        throw new Error("Cliente não encontrado");
      }
    }

    if (orderData.products) {
      const productPromises = orderData.products.map((productId) =>
        Product.findById(productId)
      );
      const foundProducts = await Promise.all(productPromises);

      if (foundProducts.some((product) => !product)) {
        throw new Error("Um ou mais produtos não encontrados");
      }
    }

    const updateData: Partial<OrderDocument> = {
      ...(orderData as Partial<OrderDocument>),
      ...(orderData.clientId && {
        clientId: new Types.ObjectId(orderData.clientId),
      }),
      ...(orderData.products && {
        products: orderData.products.map((id) => new Types.ObjectId(id)),
      }),
    };

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate<{ clientId: PopulatedUser }>("clientId", "-password")
      .populate<{ products: PopulatedProduct[] }>("products")
      .populate("laboratoryId");

    return updatedOrder
      ? this.convertToIOrder(updatedOrder as unknown as OrderDocument)
      : null;
  }

  async deleteOrder(id: string): Promise<IOrder | null> {
    const order = (await Order.findByIdAndDelete(id)) as OrderDocument | null;
    return order ? this.convertToIOrder(order) : null;
  }

  async updateOrderStatus(
    id: string,
    status: "pending" | "in_production" | "ready" | "delivered"
  ): Promise<IOrder | null> {
    const allowedStatus = [
      "pending",
      "in_production",
      "ready",
      "delivered",
    ] as const;
    if (!allowedStatus.includes(status)) {
      throw new Error("Status inválido");
    }

    return this.updateOrder(id, { status });
  }

  private convertToIOrder(order: OrderDocument): IOrder {
    const plainOrder = order.toObject();
    return {
      ...plainOrder,
      _id: plainOrder._id.toString(),
      clientId:
        plainOrder.clientId instanceof Types.ObjectId
          ? plainOrder.clientId.toString()
          : plainOrder.clientId._id.toString(),
      products: plainOrder.products.map(
        (product: PopulatedProduct | Types.ObjectId) =>
          product instanceof Types.ObjectId
            ? product.toString()
            : product._id.toString()
      ),
      laboratoryId: plainOrder.laboratoryId
        ? plainOrder.laboratoryId instanceof Types.ObjectId
          ? plainOrder.laboratoryId.toString()
          : plainOrder.laboratoryId._id.toString()
        : undefined,
    };
  }
}
