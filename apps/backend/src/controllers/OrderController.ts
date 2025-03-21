import type { Request, Response } from "express";
import { OrderService, OrderError } from "../services/OrderService";
import { z } from "zod";
import type { CreateOrderDTO, IOrder } from "../interfaces/IOrder";
import type { JwtPayload } from "jsonwebtoken";
import type { ExportOptions } from "../utils/exportUtils";
import {
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  updateOrderLaboratorySchema,
  orderQuerySchema
} from "../validators/orderValidators";
import { IProduct } from "src/interfaces/IProduct";
import { Types } from "mongoose";

interface AuthRequest extends Request {
  user?: JwtPayload & { role?: string };
}

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

      // Validar os dados com o schema do Zod
      const validatedData = createOrderSchema.parse(req.body);

      // Garantir que todos os produtos tenham productType definido
      const validProducts = validatedData.products.map(product => {
        if (!product.productType) {
          throw new Error("Todos os produtos devem ter um tipo definido");
        }
        return {
          ...product,
          // Garantir que productType nunca é undefined
          productType: product.productType as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame"
        };
      });

      // Calcular o preço final se não fornecido
      if (validatedData.finalPrice === undefined) {
        validatedData.finalPrice = validatedData.totalPrice - (validatedData.discount || 0);
      }

      // Criar o pedido com dados validados
      const orderData: CreateOrderDTO = {
        ...validatedData,
        clientId: new Types.ObjectId(validatedData.clientId),  // Converte para ObjectId
        employeeId: new Types.ObjectId(validatedData.employeeId),  // Converte para ObjectId
        laboratoryId: validatedData.laboratoryId ? new Types.ObjectId(validatedData.laboratoryId) : null,  // Converte para ObjectId ou null
        products: validProducts as IProduct[]  // Produtos já validados
      };

      const order = await this.orderService.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      // Tratamento de erros
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
      res.status(500).json({ 
        message: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const queryParams = orderQuerySchema.parse(req.query);
      const {
        page,
        limit,
        status,
        clientId,
        laboratoryId,
        startDate,
        endDate,
        productId,
        minPrice,
        maxPrice
      } = queryParams;

      const filters: Record<string, any> = {};

      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;
      if (laboratoryId) filters.laboratoryId = laboratoryId;
      if (productId) filters.productId = productId;
      if (minPrice !== undefined) filters.minPrice = minPrice;
      if (maxPrice !== undefined) filters.maxPrice = maxPrice;

      // Adicionar filtro de data se fornecido
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
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

  async updateOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }
  
      const validatedData = updateOrderSchema.parse(req.body);
      
      // Garantir que os produtos, se fornecidos, tenham productType definido
      let validProducts: IProduct[] | undefined;
      
      if (validatedData.products) {
        validProducts = validatedData.products.map(product => {
          if (!product.productType) {
            throw new Error("Todos os produtos devem ter um tipo definido");
          }
          return {
            ...product,
            productType: product.productType as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame"
          };
        }) as IProduct[];
      }
      
      // Criar a atualização com dados validados
      const updateData: Partial<IOrder> = {
        ...validatedData,
        clientId: validatedData.clientId ? new Types.ObjectId(validatedData.clientId) : undefined,  // Converte para ObjectId
        employeeId: validatedData.employeeId ? new Types.ObjectId(validatedData.employeeId) : undefined,  // Converte para ObjectId
        laboratoryId: validatedData.laboratoryId ? new Types.ObjectId(validatedData.laboratoryId) : null,  // Converte para ObjectId ou null
        products: validProducts
      };
      
      const order = await this.orderService.updateOrder(req.params.id, updateData, req.user.id, req.user.role);
      res.status(200).json(order);
    } catch (error) {
      // Tratamento de erros
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
      console.error("Error updating order:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error)
      });
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
  
      // Converter laboratoryId para ObjectId ou null
      const laboratoryId = validatedData.laboratoryId ? new Types.ObjectId(validatedData.laboratoryId) : null;
  
      const order = await this.orderService.updateOrderLaboratory(
        req.params.id,
        laboratoryId,
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

      const queryParams = orderQuerySchema.parse(req.query);
      const { page, limit, status, clientId } = queryParams;

      const filters: Record<string, any> = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;

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
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Parâmetros de consulta inválidos",
          errors: error.errors,
        });
        return;
      }
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

      const queryParams = orderQuerySchema.parse(req.query);
      const {
        status,
        clientId,
        laboratoryId,
        startDate,
        endDate,
        productId,
        minPrice,
        maxPrice
      } = queryParams;
      
      // Construir filtros
      const filters: Record<string, any> = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;
      if (laboratoryId) filters.laboratoryId = laboratoryId;
      if (productId) filters.productId = productId;
      if (minPrice !== undefined) filters.minPrice = minPrice;
      if (maxPrice !== undefined) filters.maxPrice = maxPrice;

      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
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