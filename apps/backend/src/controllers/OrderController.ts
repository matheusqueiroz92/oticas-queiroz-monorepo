import type { Request, Response } from "express";
import { Order } from "../schemas/OrderSchema";
import type { IOrder } from "../interfaces/IOrder";

export class OrderController {
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData: IOrder = req.body;
      const order = new Order(orderData);
      await order.save();
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "An unknown error occurred" });
      }
    }
  }

  async getAllOrders(_req: Request, res: Response): Promise<void> {
    try {
      const orders = await Order.find()
        .populate("clientId") // Popula o campo clientId
        .populate("products") // Popula o campo products
        .populate("laboratoryId"); // Popula o campo laboratoryId

      if (orders) {
        res.status(200).json(orders);
      } else {
        res.status(404).json({ message: "No orders found" });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      // Buscar a ordem e popular os campos em uma única query
      const order = await Order.findById(req.params.id)
        .populate("clientId", "name email role") // Campos específicos do cliente
        .populate("products", "name description price category") // Campos específicos do produto
        .exec();

      if (!order) {
        res.status(404).json({ message: "Pedido não encontrado" });
        return;
      }

      // Log para debug
      console.log(
        "Found order with populated fields:",
        JSON.stringify(order.toObject(), null, 2)
      );

      // Verificar se os campos populados existem
      if (!order.clientId || !order.products) {
        console.error("Population failed:", {
          hasClient: !!order.clientId,
          productsLength: order.products?.length,
        });
        res.status(500).json({ message: "Erro ao buscar relações do pedido" });
        return;
      }

      res.status(200).json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Erro ao buscar pedido" });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate("clientId products laboratoryId");
      if (order) {
        res.status(200).json(order);
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  }
}
