import type { Request, Response } from "express";
import { PaymentService, PaymentError } from "../services/PaymentService";
import type { JwtPayload } from "jsonwebtoken";
import type { IPayment } from "../interfaces/IPayment";
import { z } from "zod";
import type { ExportOptions } from "../utils/exportUtils";
import { validatedPaymentSchema } from "../validators/paymentValidators";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

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

      console.log("Corpo da requisição recebido:", req.body);

      // Validar os dados de acordo com o method
      const validatedData = validatedPaymentSchema.parse(req.body);

      console.log("Dados validados:", validatedData);

      // Criar o objeto de pagamento
      const paymentData = {
        ...validatedData,
        date: new Date(),
        status: "pending" as const,
        createdBy: req.user.id,
        cashRegisterId: "", // Será preenchido pelo PaymentService
      };

      console.log("Dados do pagamento antes de chamar o serviço:", paymentData);

      const payment = await this.paymentService.createPayment(paymentData);

      console.log("Pagamento criado:", payment);

      res.status(201).json(payment);
    } catch (error) {
      console.error("Erro detalhado na criação do pagamento:", error);

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

  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const payment = await this.paymentService.getPaymentById(req.params.id);
      res.status(200).json(payment);
    } catch (error) {
      console.error("Error details:", error);

      if (error instanceof PaymentError) {
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
          ["credit", "debit", "cash", "pix", "bank_slip", "promissory_note"].includes(method)
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
  
      if (req.query.cashRegisterId) {
        filters.cashRegisterId = String(req.query.cashRegisterId);
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
      console.error("Error details:", error);
      if (error instanceof PaymentError) {
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
      console.error("Error details:", error);

      if (error instanceof PaymentError) {
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
      console.error("Error details:", error);
      if (error instanceof PaymentError) {
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

  async softDeletePayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const payment = await this.paymentService.softDeletePayment(
        req.params.id,
        req.user.id
      );

      res.status(200).json(payment);
    } catch (error) {
      console.error("Error details:", error);
      if (error instanceof PaymentError) {
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

  async getDeletedPayments(req: Request, res: Response): Promise<void> {
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

      const result = await this.paymentService.getDeletedPayments(
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
      console.error("Error details:", error);
      if (error instanceof PaymentError) {
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

  async exportPayments(req: Request, res: Response): Promise<void> {
    try {
      const { format = "excel", title } = req.query;

      // Construir filtros com base nos parâmetros da query
      const filters: Partial<IPayment> = {};

      if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(String(req.query.startDate));
        const endDate = new Date(String(req.query.endDate));
        endDate.setHours(23, 59, 59, 999);

        filters.date = {
          $gte: startDate,
          $lte: endDate,
        } as unknown as Date;
      }

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

      // Exportar os pagamentos
      const exportOptions: ExportOptions = {
        format: format as "excel" | "pdf" | "csv" | "json",
        title: title as string,
        filename: `pagamentos-${Date.now()}`,
      };

      const { buffer, contentType, filename } =
        await this.paymentService.exportPayments(exportOptions, filters);

      // Configurar cabeçalhos e enviar arquivo
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting payments:", error);

      if (error instanceof PaymentError) {
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

  async getDailyFinancialReport(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date
        ? new Date(String(req.query.date))
        : new Date();

      const format =
        (req.query.format as "excel" | "pdf" | "csv" | "json") || "excel";

      // Buscar pagamentos do dia
      const payments = await this.paymentService.getDailyPayments(date);

      // Calcular totais por tipo e método
      const totalSales = payments
        .filter((p) => p.type === "sale" && p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      const totalDebtPayments = payments
        .filter((p) => p.type === "debt_payment" && p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      const totalExpenses = payments
        .filter((p) => p.type === "expense" && p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      // Alterando a verificação para cartão de crédito
      const totalByCreditCard = payments
        .filter((p) => p.paymentMethod === "credit" && p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      const totalByDebitCard = payments
        .filter((p) => p.paymentMethod === "debit" && p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      const totalByCash = payments
        .filter((p) => p.paymentMethod === "cash" && p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      const totalByPix = payments
        .filter((p) => p.paymentMethod === "pix" && p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      // Adicionar totais para boleto e promissória
      const totalByBoleto = payments
        .filter((p) => p.paymentMethod === "bank_slip" && p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      const totalByPromissoryNote = payments
        .filter(
          (p) =>
            p.paymentMethod === "promissory_note" && p.status === "completed"
        )
        .reduce((sum, p) => sum + p.amount, 0);

      // Calcular saldo do dia
      const dailyBalance = totalSales + totalDebtPayments - totalExpenses;

      // Dados para o relatório
      const reportData = {
        date: date.toISOString().split("T")[0],
        totalSales,
        totalDebtPayments,
        totalExpenses,
        totalByCreditCard,
        totalByDebitCard,
        totalByCash,
        totalByPix,
        totalByBoleto,
        totalByPromissoryNote,
        dailyBalance,
        payments,
      };

      // Se formato for JSON, retornar diretamente
      if (format === "json") {
        res.json(reportData);
        return;
      }

      // Formatar título do relatório
      const formattedDate = date.toLocaleDateString("pt-BR");
      const title = `Relatório Financeiro - ${formattedDate}`;

      // Exportar relatório
      const exportOptions: ExportOptions = {
        format,
        title,
        filename: `relatorio-financeiro-${date.toISOString().split("T")[0]}`,
      };

      const { buffer, contentType, filename } =
        await this.paymentService.exportFinancialReport(
          reportData,
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
      console.error("Error generating financial report:", error);
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

  async updateCheckStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }
      
      const { status, rejectionReason } = req.body;
      
      // Validação básica
      if (!status || !["pending", "compensated", "rejected"].includes(status)) {
        res.status(400).json({ message: "Status inválido" });
        return;
      }
      
      // Se o status for "rejected", exigir o motivo
      if (status === "rejected" && !rejectionReason) {
        res.status(400).json({ message: "Motivo da rejeição é obrigatório quando o status é 'rejected'" });
        return;
      }
      
      const payment = await this.paymentService.updateCheckCompensationStatus(
        req.params.id,
        status,
        rejectionReason
      );
      
      res.status(200).json(payment);
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error updating check status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getChecksByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      
      if (!["pending", "compensated", "rejected"].includes(status)) {
        res.status(400).json({ message: "Status inválido" });
        return;
      }
      
      const startDate = req.query.startDate 
        ? new Date(String(req.query.startDate))
        : undefined;
        
      const endDate = req.query.endDate
        ? new Date(String(req.query.endDate))
        : undefined;
      
      const checks = await this.paymentService.getChecksByStatus(
        status as "pending" | "compensated" | "rejected",
        startDate,
        endDate
      );
      
      res.status(200).json(checks);
    } catch (error) {
      console.error("Error getting checks by status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async recalculateDebts(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id || req.user?.role !== "admin") {
        res.status(403).json({
          message: "Acesso não autorizado. Apenas administradores podem recalcular débitos."
        });
        return;
      }
  
      const { clientId } = req.query;
      const result = await this.paymentService.recalculateClientDebts(clientId as string | undefined);
      
      res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao recalcular débitos:", error);
      res.status(500).json({
        message: "Erro interno ao recalcular débitos",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }  
}
