import type { Request, Response } from "express";
import { ReportService } from "../services/ReportService";
import { ReportError } from "../interfaces/IReport";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

const reportSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  type: z.enum(["sales", "inventory", "customers", "orders", "financial"]),
  filters: z.object({
    startDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    endDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    status: z.array(z.string()).optional(),
    paymentMethod: z.array(z.string()).optional(),
    productCategory: z.array(z.string()).optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
  }),
  format: z.enum(["json", "pdf", "excel"]).default("json"),
});

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  async createReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const validatedData = reportSchema.parse(req.body);

      const report = await this.reportService.createReport(
        validatedData.name,
        validatedData.type,
        validatedData.filters,
        req.user.id,
        validatedData.format
      );

      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof ReportError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Erro ao criar relatório:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const report = await this.reportService.getReport(req.params.id);

      res.status(200).json(report);
    } catch (error) {
      if (error instanceof ReportError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Erro ao buscar relatório:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getUserReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await this.reportService.getUserReports(
        req.user.id,
        page,
        limit
      );

      res.status(200).json({
        reports: result.reports,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      console.error("Erro ao listar relatórios:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async downloadReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const report = await this.reportService.getReport(req.params.id);

      // Verificar se o relatório está completo
      if (report.status !== "completed") {
        res.status(400).json({
          message: "Relatório ainda não está pronto para download",
          status: report.status,
        });
        return;
      }

      // Verificar se o formato é suportado
      const format = (req.query.format as string) || report.format;
      if (!["json", "pdf", "excel"].includes(format)) {
        res.status(400).json({ message: "Formato não suportado" });
        return;
      }

      // Para este exemplo, apenas retornamos o JSON
      // Em uma implementação real, você geraria o PDF ou Excel aqui
      if (format === "json") {
        res.status(200).json(report.data);
        return;
      }

      // Para outros formatos, você implementaria a conversão
      res
        .status(501)
        .json({
          message: "Exportação para este formato ainda não implementada",
        });
    } catch (error) {
      if (error instanceof ReportError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Erro ao fazer download do relatório:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
