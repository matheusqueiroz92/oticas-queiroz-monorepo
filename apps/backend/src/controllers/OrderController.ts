import type { Request, Response } from "express";
import { OrderService, OrderError } from "../services/OrderService";
import { UserService } from "../services/UserService";
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
  private userService: UserService;

  constructor() {
    this.orderService = new OrderService();
    this.userService = new UserService();
  }

  async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log("Received order data:", JSON.stringify(req.body, null, 2));
      console.log("Prescription data:", JSON.stringify(req.body.prescriptionData, null, 2));
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const validatedData = createOrderSchema.parse(req.body);

      const validProducts = validatedData.products.map(product => {
        if (typeof product === 'string' || product instanceof Types.ObjectId) {
          return product;
        }

        if (!product.productType) {
          throw new Error("Todos os produtos devem ter um tipo definido");
        }
        
        return {
          ...product,
          productType: product.productType as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame"
        };
      });

      if (validatedData.finalPrice === undefined) {
        validatedData.finalPrice = validatedData.totalPrice - (validatedData.discount || 0);
      }

      if (validatedData.isDeleted !== undefined) {
        validatedData.isDeleted = typeof validatedData.isDeleted === 'string'
          ? validatedData.isDeleted === 'true'
          : Boolean(validatedData.isDeleted);
      }      

      const orderData: CreateOrderDTO = {
        ...validatedData,
        clientId: new Types.ObjectId(validatedData.clientId),
        employeeId: new Types.ObjectId(validatedData.employeeId),
        laboratoryId: validatedData.laboratoryId ? new Types.ObjectId(validatedData.laboratoryId) : null,
        products: validProducts as IProduct[],
      };

      const order = await this.orderService.createOrder(orderData);
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
        employeeId,
        clientId,
        laboratoryId,
        serviceOrder,
        paymentMethod,
        startDate,
        endDate,
        productId,
        minPrice,
        maxPrice,
        search,
        cpf,
        sort
      } = queryParams;
  
      const filters: Record<string, any> = {};
  
      if (cpf) {
        try {
          const client = await this.userService.getUserByCpf(cpf as string);
          if (client) {
            filters.clientId = client._id.toString();
          } else {
            res.status(200).json({
              orders: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
              },
            });
            return;
          }
        } catch (error) {
          res.status(200).json({
            orders: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          });
          return;
        }
      }
      
      if (serviceOrder) {
        const cleanServiceOrder = serviceOrder.replace(/\D/g, '');
        filters.serviceOrder = cleanServiceOrder;
      }
      
      if (status) {
        filters.status = status;
      }
      
      if (employeeId) {
        filters.employeeId = employeeId;
      }
      
      if (clientId) {
        filters.clientId = clientId;
      }
      
      if (laboratoryId) {
        filters.laboratoryId = laboratoryId;
      }
      
      if (paymentMethod) {
        filters.paymentMethod = paymentMethod;
      }
      
      if (productId) filters.productId = productId;
      if (minPrice !== undefined) filters.minPrice = minPrice;
      if (maxPrice !== undefined) filters.maxPrice = maxPrice;
  
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
      
      if (search) {
        filters.search = search;
      }
      
      if (sort) {
        filters.sort = sort;
      } else {
        filters.sort = "-createdAt";
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
      
      let validProducts: any[] | undefined;
      
      if (validatedData.products) {
        validProducts = validatedData.products.map(product => {
          if (typeof product === 'string' || product instanceof Types.ObjectId) {
            return product;
          }
          
          if (typeof product === 'object' && product !== null) {
            if (!product.productType) {
              throw new Error("Todos os produtos devem ter um tipo definido");
            }
            
            return {
              ...product,
              _id: product._id,
              name: product.name || "",
              description: product.description || "",
              sellPrice: product.sellPrice || 0,
              productType: product.productType as "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame"
            };
          }
          
          throw new Error("Formato de produto inválido");
        });
      }
      
      if (validatedData.isDeleted !== undefined) {
        validatedData.isDeleted = typeof validatedData.isDeleted === 'string'
          ? validatedData.isDeleted === 'true'
          : Boolean(validatedData.isDeleted);
      }
      
      const updateData: Partial<IOrder> = {
        ...validatedData,
        clientId: validatedData.clientId ? new Types.ObjectId(validatedData.clientId) : undefined,
        employeeId: validatedData.employeeId ? new Types.ObjectId(validatedData.employeeId) : undefined,
        laboratoryId: validatedData.laboratoryId 
          ? new Types.ObjectId(validatedData.laboratoryId) 
          : validatedData.laboratoryId === null 
            ? null 
            : undefined,
        products: validProducts
      };
      
      const order = await this.orderService.updateOrder(
        req.params.id, 
        updateData, 
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

  async exportOrders(req: AuthRequest, res: Response): Promise<void> {
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

    const exportOptions: ExportOptions = {
      format: format as "excel" | "pdf" | "csv" | "json",
      title: title as string,
      filename: `pedidos-${Date.now()}`,
    };

    try {
      const { buffer, contentType, filename } =
        await this.orderService.exportOrders(exportOptions, filters);

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (exportError) {
      console.error("Erro específico na exportação:", exportError);
      throw exportError;
    }
  } catch (error) {
    console.error("Erro detalhado ao exportar pedidos:", error);

    if (error instanceof OrderError) {
      res.status(400).json({ message: error.message });
      return;
    }

    res.status(500).json({
      message: "Erro interno do servidor ao exportar pedidos",
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

      const exportOptions: ExportOptions = {
        format,
        title: `Resumo Diário de Pedidos - ${date.toLocaleDateString()}`,
        filename: `resumo-diario-pedidos-${date.toISOString().split("T")[0]}`,
      };

      const { buffer, contentType, filename } =
        await this.orderService.exportDailySummary(date, exportOptions);

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

  async getOrderPayments(req: Request, res: Response): Promise<void> {
    try {
      const payments = await this.orderService.getOrderPayments(req.params.id);
      res.status(200).json(payments);
    } catch (error) {
      if (error instanceof OrderError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
  
  async getPaymentStatusSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.orderService.getPaymentStatusSummary(req.params.id);
      res.status(200).json(summary);
    } catch (error) {
      if (error instanceof OrderError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}