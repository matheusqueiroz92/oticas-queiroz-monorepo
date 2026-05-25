import type { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { SicrediService } from "../services/SicrediService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import {
  generateSicrediBoletoSchema,
  cancelSicrediBoletoSchema,
} from "../validators/sicrediValidators";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class SicrediController {
  private paymentService: PaymentService;
  private sicrediService: SicrediService;

  constructor() {
    this.paymentService = new PaymentService();
    this.sicrediService = new SicrediService();
  }

  async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.paymentService.testSicrediConnection();

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Conexão com SICREDI estabelecida com sucesso",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Falha na conexão com SICREDI",
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão SICREDI:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined,
      });
    }
  }

  async generateBoleto(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const validatedData = generateSicrediBoletoSchema.parse(req.body);

      const result = await this.paymentService.generateSicrediBoleto(
        validatedData.paymentId,
        validatedData.customerData
      );

      if (result.success && result.data) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Boleto gerado com sucesso",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Erro ao gerar boleto",
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Erro ao gerar boleto SICREDI:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined,
      });
    }
  }

  async checkBoletoStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const { paymentId } = req.params;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: "ID do pagamento é obrigatório",
        });
        return;
      }

      const result = await this.paymentService.checkSicrediBoletoStatus(paymentId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: "Status consultado com sucesso",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Erro ao consultar status",
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Erro ao consultar status do boleto SICREDI:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined,
      });
    }
  }

  async cancelBoleto(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const validatedData = cancelSicrediBoletoSchema.parse(req.body);

      const result = await this.paymentService.cancelSicrediBoleto(
        validatedData.paymentId,
        validatedData.motivo
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Boleto cancelado com sucesso",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Erro ao cancelar boleto",
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar boleto SICREDI:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined,
      });
    }
  }

  async getBoletoPdf(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const { paymentId } = req.params;
      if (!paymentId) {
        res.status(400).json({ success: false, message: "ID do pagamento é obrigatório" });
        return;
      }

      const payment = await this.paymentService.getPaymentById(paymentId);
      const linhaDigitavel = payment.bank_slip?.sicredi?.linhaDigitavel;

      if (!linhaDigitavel) {
        res.status(400).json({
          success: false,
          message: "Boleto ainda não foi emitido ou linha digitável indisponível",
        });
        return;
      }

      const pdfBuffer = await this.sicrediService.getBoletoPdf(linhaDigitavel);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="boleto-${payment.bank_slip?.sicredi?.nossoNumero || paymentId}.pdf"`
      );
      res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error("Erro ao obter PDF do boleto SICREDI:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        details: process.env.NODE_ENV !== "production" ? String(error) : undefined,
      });
    }
  }
}
