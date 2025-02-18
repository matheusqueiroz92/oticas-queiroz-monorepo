// src/controllers/OrderController.ts
import type { Request, Response } from "express";
import { OrderService, OrderError } from "../services/OrderService";
import { z } from "zod";
import type { IOrder } from "../interfaces/IOrder";

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

const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => Number(val) || 1),
  limit: z
    .string()
    .optional()
    .transform((val) => Number(val) || 10),
  status: z.enum(["pending", "in_production", "ready", "delivered"]).optional(),
  clientId: z.string().optional(),
  laboratoryId: z.string().optional(),
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

  async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, status, clientId, laboratoryId } = querySchema.parse(
        req.query
      );

      const filters: Partial<IOrder> = {};

      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;
      if (laboratoryId) filters.laboratoryId = laboratoryId;

      const result = await this.orderService.getAllOrders(page, limit, filters);

      res.status(200).json({
        orders: result.orders,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Parâmetros de consulta inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof OrderError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Error getting orders:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const order = await this.orderService.getOrderById(req.params.id);
      res.status(200).json(order);
    } catch (error) {
      if (error instanceof OrderError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Error getting order:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = updateOrderSchema.parse(req.body);
      const order = await this.orderService.updateOrderStatus(
        req.params.id,
        validatedData.status,
        req.params.userId,
        req.params.userRole
      );
      res.status(200).json(order);
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
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getOrdersByClient(req: Request, res: Response): Promise<void> {
    try {
      const orders = await this.orderService.getOrdersByClientId(
        req.params.clientId
      );
      res.status(200).json(orders);
    } catch (error) {
      if (error instanceof OrderError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Error getting client orders:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
