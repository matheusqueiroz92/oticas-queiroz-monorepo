import type { Request, Response } from "express";
import { LensTypeService, LensTypeError } from "../services/LensTypeService";
import { z } from "zod";
import type { ICreateLensTypeDTO } from "../interfaces/ILensType";

const createLensTypeSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  brand: z.string().optional(),
});

const updateLensTypeSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
    description: z
      .string()
      .min(10, "Descrição deve ter no mínimo 10 caracteres")
      .optional(),
    brand: z
      .string()
      .min(2, "Marca deve ter no mínimo 2 caracteres")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Pelo menos um campo deve ser fornecido para atualização"
  );

type CreateLensTypeInput = z.infer<typeof createLensTypeSchema>;
type UpdateLensTypeInput = z.infer<typeof updateLensTypeSchema>;

export class LensTypeController {
  private lensTypeService: LensTypeService;

  constructor() {
    this.lensTypeService = new LensTypeService();
  }

  async createLensType(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, brand } = req.body;

      const lensTypeData: ICreateLensTypeDTO = {
        name,
        description,
        brand,
      };

      const lensType = await this.lensTypeService.createLensType(lensTypeData);
      res.status(201).json(lensType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof LensTypeError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error creating lens type:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getAllLensType(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const filters: Partial<ICreateLensTypeDTO> = {};

      // Filtros opcionais
      if (req.query.brand) filters.brand = String(req.query.brand);

      const { lensType, total } = await this.lensTypeService.getAllLensType(
        page,
        limit,
        filters
      );

      res.status(200).json({
        lensType,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof LensTypeError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getLensTypeById(req: Request, res: Response): Promise<void> {
    try {
      const lensType = await this.lensTypeService.getLensTypeById(
        req.params.id
      );
      res.status(200).json(lensType);
    } catch (error) {
      if (error instanceof LensTypeError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateLensType(req: Request, res: Response): Promise<void> {
    try {
      const updateData: Partial<ICreateLensTypeDTO> = {};

      if (req.body.name) updateData.name = req.body.name;
      if (req.body.description) updateData.description = req.body.description;
      if (req.body.brand) updateData.brand = req.body.brand;

      const validatedData = updateLensTypeSchema.parse(updateData);

      const lensType = await this.lensTypeService.updateLensType(
        req.params.id,
        validatedData
      );

      res.status(200).json(lensType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof LensTypeError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async deleteLensType(req: Request, res: Response): Promise<void> {
    try {
      await this.lensTypeService.deleteLensType(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof LensTypeError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
