import type { Request, Response } from "express";
import { OrderService, OrderError } from "../services/OrderService";
import { z } from "zod";
import { Order } from "../schemas/OrderSchema";

const eyeDataSchema = z.object({
  sph: z.number(),
  cyl: z.number(),
  axis: z.number(),
  pd: z.number(),
});

const prescriptionDataSchema = z.object({
  doctorName: z
    .string()
    .min(2, "Nome do médico deve ter no mínimo 2 caracteres"),
  clinicName: z
    .string()
    .min(2, "Nome da clínica deve ter no mínimo 2 caracteres"),
  appointmentdate: z.coerce.date(),
  leftEye: z.object({
    near: eyeDataSchema,
    far: eyeDataSchema,
  }),
  rightEye: z.object({
    near: eyeDataSchema,
    far: eyeDataSchema,
  }),
});

const createOrderSchema = z.object({
  clientId: z.string().min(1, "ID do cliente é obrigatório"),
  employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
  products: z.array(z.string()).min(1, "Pelo menos um produto é obrigatório"),
  description: z.string().optional(),
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  paymentEntry: z.number().min(0).optional(),
  installments: z.number().min(1).optional(),
  deliveryDate: z.coerce.date(),
  status: z.enum(["pending", "in_production", "ready", "delivered"]),
  laboratoryId: z.string().optional(),
  lensType: z.string().min(1, "Tipo de lente é obrigatório"),
  prescriptionData: prescriptionDataSchema,
  totalPrice: z.number().positive("Preço total deve ser positivo"),
});

const updateOrderSchema = z.object({
  status: z.enum(["pending", "in_production", "ready", "delivered"]),
});

type CreateOrderInput = z.infer<typeof createOrderSchema>;
type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const order = await this.orderService.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof OrderError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
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
