import type { Request, Response } from "express";
import {
  CashRegisterService,
  CashRegisterError,
} from "../services/CashRegisterService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";

interface AuthRequest extends Request {
  user?: JwtPayload & { role?: string };
}

const openRegisterSchema = z.object({
  openingBalance: z.number().min(0, "Valor inicial não pode ser negativo"),
  observations: z.string().optional(),
  openingDate: z.date().optional(),
});

const closeRegisterSchema = z.object({
  closingBalance: z.number().min(0, "Valor final não pode ser negativo"),
  observations: z.string().optional(),
});

export class CashRegisterController {
  private cashRegisterService: CashRegisterService;

  constructor() {
    this.cashRegisterService = new CashRegisterService();
  }

  async getAllRegisters(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const filters: Record<string, unknown> = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.startDate) filters.startDate = req.query.startDate;
      if (req.query.endDate) filters.endDate = req.query.endDate;
      if (req.query.search) filters.search = req.query.search;

      const result = await this.cashRegisterService.getAllRegisters(
        page,
        limit,
        filters
      );

      res.status(200).json({
        registers: result.registers,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async openRegister(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (req.user.role !== "admin") {
        res.status(403).json({ message: "Acesso não autorizado" });
        return;
      }

      const validatedData = openRegisterSchema.parse({
        ...req.body,
        openingDate: req.body.openingDate
          ? new Date(req.body.openingDate)
          : new Date(),
      });

      const register = await this.cashRegisterService.openRegister({
        ...validatedData,
        openedBy: req.user.id,
      });

      res.status(201).json(register);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof CashRegisterError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async closeRegister(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (req.user.role !== "admin") {
        res.status(403).json({ message: "Acesso não autorizado" });
        return;
      }

      const validatedData = closeRegisterSchema.parse(req.body);

      const register = await this.cashRegisterService.closeRegister({
        ...validatedData,
        closedBy: req.user.id,
      });

      res.status(200).json(register);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof CashRegisterError) {
        if (error.message === "Não há caixa aberto") {
          res.status(404).json({ message: error.message });
          return;
        }
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getCurrentRegister(_req: Request, res: Response): Promise<void> {
    try {
      const register = await this.cashRegisterService.getCurrentRegister();
      res.status(200).json(register);
    } catch (error) {
      if (error instanceof CashRegisterError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getRegisterById(req: Request, res: Response): Promise<void> {
    try {
      const register = await this.cashRegisterService.getRegisterById(
        req.params.id
      );
      res.status(200).json(register);
    } catch (error) {
      if (error instanceof CashRegisterError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getRegisterSummary(req: Request, res: Response): Promise<void> {
    try {
      console.log(`Buscando resumo do caixa: ${req.params.id}`);
      const summary = await this.cashRegisterService.getRegisterSummary(
        req.params.id
      );
      res.status(200).json(summary);
    } catch (error) {
      console.error("Erro ao buscar resumo do caixa:", error);
      
      if (error instanceof CashRegisterError) {
        res.status(404).json({ message: error.message });
        return;
      }
      
      res.status(500).json({ 
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" 
          ? error instanceof Error ? error.message : String(error) 
          : undefined
      });
    }
  }

  async getDailySummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const date = req.query.date
        ? new Date(String(req.query.date))
        : new Date();

      const summary = await this.cashRegisterService.getDailySummary(date);
      res.status(200).json(summary);
    } catch (error) {
      if (error instanceof CashRegisterError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async softDeleteRegister(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (req.user.role !== "admin") {
        res.status(403).json({ message: "Acesso não autorizado" });
        return;
      }

      const deletedRegister = await this.cashRegisterService.softDeleteRegister(
        req.params.id,
        req.user.id
      );

      res.status(200).json(deletedRegister);
    } catch (error) {
      if (error instanceof CashRegisterError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getDeletedRegisters(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      if (req.user.role !== "admin") {
        res.status(403).json({ message: "Acesso não autorizado" });
        return;
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await this.cashRegisterService.getDeletedRegisters(
        page,
        limit
      );

      res.status(200).json({
        registers: result.registers,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async exportRegisterSummary(req: Request, res: Response): Promise<void> {
    try {
      const format =
        (req.query.format as "excel" | "pdf" | "csv" | "json") || "excel";
      const title = (req.query.title as string) || "Resumo de Caixa";

      const summary = await this.cashRegisterService.getRegisterSummary(
        req.params.id
      );

      const exportOptions = {
        format,
        title,
        filename: `caixa-${req.params.id}`,
      };

      const { buffer, contentType, filename } =
        await this.cashRegisterService.exportRegisterSummary(
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
      if (error instanceof CashRegisterError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async exportDailySummary(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date
        ? new Date(String(req.query.date))
        : new Date();

      const format =
        (req.query.format as "excel" | "pdf" | "csv" | "json") || "excel";
      const title =
        (req.query.title as string) ||
        `Resumo Diário - ${date.toLocaleDateString()}`;

      const exportOptions = {
        format,
        title,
        filename: `resumo-diario-${date.toISOString().split("T")[0]}`,
      };

      const { buffer, contentType, filename } =
        await this.cashRegisterService.exportDailySummary(date, exportOptions);

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (error) {
      if (error instanceof CashRegisterError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
