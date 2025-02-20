import type { Request, Response } from "express";
import { PaymentService, PaymentError } from "../services/PaymentService";
import type { JwtPayload } from "jsonwebtoken";
import type { IPayment, CreatePaymentDTO } from "../interfaces/IPayment";
import { z } from "zod";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

const paymentSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  type: z.enum(["sale", "debt_payment", "expense"] as const, {
    errorMap: () => ({ message: "Tipo de pagamento inválido" }),
  }),
  paymentMethod: z.enum(
    ["credit", "debit", "cash", "pix", "installment"] as const,
    {
      errorMap: () => ({ message: "Método de pagamento inválido" }),
    }
  ),
  installments: z
    .object({
      current: z.number().min(1),
      total: z.number().min(2),
      value: z.number().positive(),
    })
    .optional(),
  orderId: z.string().optional(),
  userId: z.string().optional(),
  legacyClientId: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
});

type PaymentInput = z.infer<typeof paymentSchema>;

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const validatedData = paymentSchema.parse(req.body);

      const paymentData: CreatePaymentDTO = {
        ...validatedData,
        date: new Date(),
        status: "pending",
        createdBy: req.user.id,
        cashRegisterId: "", // Será preenchido pelo PaymentService
      };

      const payment = await this.paymentService.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof PaymentError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const payment = await this.paymentService.getPaymentById(req.params.id);
      res.status(200).json(payment);
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getAllPayments(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const filters: Partial<IPayment> = {};

      if (req.query.type) {
        const type = String(req.query.type);
        if (["sale", "debt_payment", "expense"].includes(type)) {
          filters.type = type as IPayment["type"];
        }
      }

      if (req.query.paymentMethod) {
        const method = String(req.query.paymentMethod);
        if (
          ["credit", "debit", "cash", "pix", "installment"].includes(method)
        ) {
          filters.paymentMethod = method as IPayment["paymentMethod"];
        }
      }

      if (req.query.status) {
        const status = String(req.query.status);
        if (["pending", "completed", "cancelled"].includes(status)) {
          filters.status = status as IPayment["status"];
        }
      }

      const result = await this.paymentService.getAllPayments(
        page,
        limit,
        filters
      );

      res.status(200).json({
        payments: result.payments,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getDailyPayments(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date
        ? new Date(String(req.query.date))
        : new Date();
      const type = req.query.type
        ? (String(req.query.type) as IPayment["type"])
        : undefined;

      const payments = await this.paymentService.getDailyPayments(date, type);

      res.status(200).json(payments);
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async cancelPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const payment = await this.paymentService.cancelPayment(
        req.params.id,
        req.user.id
      );

      res.status(200).json(payment);
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
