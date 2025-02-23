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
      const summary = await this.cashRegisterService.getRegisterSummary(
        req.params.id
      );
      res.status(200).json(summary);
    } catch (error) {
      if (error instanceof CashRegisterError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
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
}
