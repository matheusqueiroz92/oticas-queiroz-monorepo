import type { Request, Response } from "express";
import { OrderService, OrderError } from "../services/OrderService";
import { z } from "zod";
import type { IOrder } from "../interfaces/IOrder";
import type { JwtPayload } from "jsonwebtoken";
import type { ExportOptions } from "../utils/exportUtils";

interface AuthRequest extends Request {
  user?: JwtPayload & { role?: string };
}

// Esquema base para todos os tipos de pedido
const baseOrderSchema = z.object({
  clientId: z.string().min(1, "ID do cliente é obrigatório"),
  employeeId: z.string().min(1, "ID do funcionário é obrigatório"),
  productType: z.enum(["glasses", "lensCleaner"]),
  product: z.string().min(1, "Produto é obrigatório"),
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  paymentEntry: z.number().min(0).optional(),
  installments: z.number().min(1).optional(),
  orderDate: z.coerce.date(),
  deliveryDate: z.coerce.date(),
  status: z.enum(["pending", "in_production", "ready", "delivered"]),
  totalPrice: z.number().positive("Preço total deve ser positivo"),
  observations: z.string().optional(),
});

// Esquema para dados de prescrição
const prescriptionDataSchema = z.object({
  doctorName: z
    .string()
    .min(2, "Nome do médico deve ter no mínimo 2 caracteres"),
  clinicName: z
    .string()
    .min(2, "Nome da clínica deve ter no mínimo 2 caracteres"),
  appointmentDate: z.coerce.date(),
  leftEye: z.object({
    sph: z.number(),
    cyl: z.number(),
    axis: z.number(),
  }),
  rightEye: z.object({
    sph: z.number(),
    cyl: z.number(),
    axis: z.number(),
  }),
  nd: z.number(),
  oc: z.number(),
  addition: z.number(),
});

// Esquema completo do pedido
const createOrderSchema = baseOrderSchema
  .extend({
    // Campos condicionais para óculos
    glassesType: z.enum(["prescription", "sunglasses"]).optional(),
    glassesFrame: z.enum(["with", "no"]).optional(),
    laboratoryId: z.string().optional().nullable(),
    lensType: z.string().optional(),
    prescriptionData: prescriptionDataSchema.optional(),
  })
  .refine(
    (data) => {
      // Se for óculos, precisa de glassesType e glassesFrame
      if (data.productType === "glasses") {
        return !!data.glassesType && !!data.glassesFrame && !!data.lensType;
      }
      return true;
    },
    {
      message:
        "Para óculos, é necessário informar o tipo, armação e tipo de lente",
      path: ["productType"],
    }
  )
  .refine(
    (data) => {
      // Se for óculos de grau, precisa ter dados de prescrição
      if (
        data.productType === "glasses" &&
        data.glassesType === "prescription"
      ) {
        return !!data.prescriptionData;
      }
      return true;
    },
    {
      message: "Dados de prescrição são obrigatórios para óculos de grau",
      path: ["prescriptionData"],
    }
  );

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "in_production",
    "ready",
    "delivered",
    "cancelled",
  ]),
});

const updateOrderLaboratorySchema = z.object({
  laboratoryId: z.string().min(1, "ID do laboratório é obrigatório"),
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
  status: z
    .enum(["pending", "in_production", "ready", "delivered", "cancelled"])
    .optional(),
  clientId: z.string().optional(),
  laboratoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CreateOrderInput = z.infer<typeof createOrderSchema>;
type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
type UpdateOrderLaboratoryInput = z.infer<typeof updateOrderLaboratorySchema>;

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const validatedData = createOrderSchema.parse(req.body);

      // Remover laboratoryId se for uma string vazia
      if (validatedData.laboratoryId === "") {
        validatedData.laboratoryId = undefined;
      }

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
      const {
        page,
        limit,
        status,
        clientId,
        laboratoryId,
        startDate,
        endDate,
      } = querySchema.parse(req.query);

      const filters: Partial<IOrder> = {};

      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;
      if (laboratoryId) filters.laboratoryId = laboratoryId;

      // Adicionar filtro de data se fornecido
      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);

        filters.createdAt = {
          $gte: startDateObj,
          $lte: endDateObj,
        } as unknown as Date;
      }

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

  async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const validatedData = updateOrderStatusSchema.parse(req.body);
      const order = await this.orderService.updateOrderStatus(
        req.params.id,
        validatedData.status,
        req.user.id,
        req.user.role
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

  async updateOrderLaboratory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const validatedData = updateOrderLaboratorySchema.parse(req.body);
      const order = await this.orderService.updateOrderLaboratory(
        req.params.id,
        validatedData.laboratoryId,
        req.user.id,
        req.user.role
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
      console.error("Error updating order laboratory:", error);
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

  async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const order = await this.orderService.cancelOrder(
        req.params.id,
        req.user.id,
        req.user.role
      );
      res.status(200).json(order);
    } catch (error) {
      if (error instanceof OrderError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async softDeleteOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const order = await this.orderService.softDeleteOrder(
        req.params.id,
        req.user.id,
        req.user.role
      );
      res.status(200).json(order);
    } catch (error) {
      if (error instanceof OrderError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getDeletedOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id || req.user?.role !== "admin") {
        res.status(403).json({
          message: "Acesso negado. Requer permissão de administrador.",
        });
        return;
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const filters: Partial<IOrder> = {};
      if (req.query.status) {
        filters.status = req.query.status as IOrder["status"];
      }

      if (req.query.clientId) {
        filters.clientId = req.query.clientId as string;
      }

      const result = await this.orderService.getDeletedOrders(
        page,
        limit,
        filters
      );

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
      console.error("Error getting deleted orders:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getDailyOrders(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date
        ? new Date(String(req.query.date))
        : new Date();

      const orders = await this.orderService.getDailyOrders(date);
      res.status(200).json(orders);
    } catch (error) {
      console.error("Error getting daily orders:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async exportOrders(req: Request, res: Response): Promise<void> {
    try {
      const { format = "excel", title } = req.query;

      // Construir filtros com base nos parâmetros da query
      const filters: Partial<IOrder> = {};

      if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(String(req.query.startDate));
        const endDate = new Date(String(req.query.endDate));
        endDate.setHours(23, 59, 59, 999);

        filters.createdAt = {
          $gte: startDate,
          $lte: endDate,
        } as unknown as Date;
      }

      if (req.query.status) {
        filters.status = req.query.status as IOrder["status"];
      }

      if (req.query.clientId) {
        filters.clientId = req.query.clientId as string;
      }

      if (req.query.laboratoryId) {
        filters.laboratoryId = req.query.laboratoryId as string;
      }

      // Exportar os pedidos
      const exportOptions: ExportOptions = {
        format: format as "excel" | "pdf" | "csv" | "json",
        title: title as string,
        filename: `pedidos-${Date.now()}`,
      };

      const { buffer, contentType, filename } =
        await this.orderService.exportOrders(exportOptions, filters);

      // Configurar cabeçalhos e enviar arquivo
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting orders:", error);

      if (error instanceof OrderError) {
        res.status(400).json({ message: error.message });
        return;
      }

      res.status(500).json({
        message: "Erro interno do servidor",
        details:
          process.env.NODE_ENV !== "production"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      });
    }
  }

  async exportDailySummary(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date
        ? new Date(String(req.query.date))
        : new Date();

      const format =
        (req.query.format as "excel" | "pdf" | "csv" | "json") || "excel";

      // Exportar resumo diário
      const exportOptions: ExportOptions = {
        format,
        title: `Resumo Diário de Pedidos - ${date.toLocaleDateString()}`,
        filename: `resumo-diario-pedidos-${date.toISOString().split("T")[0]}`,
      };

      const { buffer, contentType, filename } =
        await this.orderService.exportDailySummary(date, exportOptions);

      // Configurar cabeçalhos e enviar arquivo
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting daily summary:", error);
      res.status(500).json({
        message: "Erro interno do servidor",
        details:
          process.env.NODE_ENV !== "production"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      });
    }
  }

  async exportOrderDetails(req: Request, res: Response): Promise<void> {
    try {
      const format =
        (req.query.format as "excel" | "pdf" | "csv" | "json") || "excel";

      // Exportar detalhes do pedido
      const exportOptions: ExportOptions = {
        format,
        title: `Detalhes do Pedido - ${req.params.id}`,
        filename: `pedido-${req.params.id}`,
      };

      const { buffer, contentType, filename } =
        await this.orderService.exportOrderDetails(
          req.params.id,
          exportOptions
        );

      // Configurar cabeçalhos e enviar arquivo
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting order details:", error);

      if (error instanceof OrderError) {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(500).json({
        message: "Erro interno do servidor",
        details:
          process.env.NODE_ENV !== "production"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      });
    }
  }
}
