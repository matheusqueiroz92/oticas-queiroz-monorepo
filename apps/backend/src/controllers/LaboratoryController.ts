import type { Request, Response } from "express";
import {
  LaboratoryService,
  LaboratoryError,
} from "../services/LaboratoryService";
import { z } from "zod";

const addressSchema = z.object({
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z
    .string()
    .min(2, "Estado é obrigatório")
    .max(2, "Estado deve ter 2 letras"),
  zipCode: z
    .string()
    .min(8, "CEP deve ter 8 dígitos")
    .max(8, "CEP deve ter 8 dígitos"),
});

const createLaboratorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  address: addressSchema,
  phone: z.string().min(10, "Telefone deve ter no mínimo 10 dígitos"),
  email: z.string().email("Email inválido"),
  contactName: z.string().min(1, "Nome do contato é obrigatório"),
  isActive: z.boolean().default(true),
});

const updateLaboratorySchema = createLaboratorySchema.partial();

export class LaboratoryController {
  private laboratoryService: LaboratoryService;

  constructor() {
    this.laboratoryService = new LaboratoryService();
  }

  async createLaboratory(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createLaboratorySchema.parse(req.body);
      const laboratory =
        await this.laboratoryService.createLaboratory(validatedData);
      res.status(201).json(laboratory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof LaboratoryError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error creating laboratory:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
  async getAllLaboratories(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const filters = {
        ...(req.query.isActive !== undefined && {
          isActive: req.query.isActive === "true",
        }),
      };

      const result = await this.laboratoryService.getAllLaboratories(
        page,
        limit,
        filters
      );

      res.status(200).json({
        laboratories: result.laboratories,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      if (error instanceof LaboratoryError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Error getting laboratories:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getLaboratoryById(req: Request, res: Response): Promise<void> {
    try {
      const laboratory = await this.laboratoryService.getLaboratoryById(
        req.params.id
      );
      res.status(200).json(laboratory);
    } catch (error) {
      if (error instanceof LaboratoryError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Error getting laboratory:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateLaboratory(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = updateLaboratorySchema.parse(req.body);
      const laboratory = await this.laboratoryService.updateLaboratory(
        req.params.id,
        validatedData
      );
      res.status(200).json(laboratory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof LaboratoryError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error updating laboratory:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async deleteLaboratory(req: Request, res: Response): Promise<void> {
    try {
      await this.laboratoryService.deleteLaboratory(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof LaboratoryError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Error deleting laboratory:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async toggleLaboratoryStatus(req: Request, res: Response): Promise<void> {
    try {
      const laboratory = await this.laboratoryService.toggleLaboratoryStatus(
        req.params.id
      );
      res.status(200).json(laboratory);
    } catch (error) {
      if (error instanceof LaboratoryError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Error toggling laboratory status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
