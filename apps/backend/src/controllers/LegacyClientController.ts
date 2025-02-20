import type { Request, Response } from "express";
import {
  LegacyClientService,
  LegacyClientError,
} from "../services/LegacyClientService";
import type { ILegacyClient } from "../interfaces/ILegacyClient";
import { z } from "zod";

const addressSchema = z
  .object({
    street: z.string().min(1, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().length(2, "Estado deve ter 2 letras"),
    zipCode: z.string().length(8, "CEP deve ter 8 dígitos"),
  })
  .optional();

const createClientSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  documentId: z.string().min(11, "Documento deve ter no mínimo 11 dígitos"),
  email: z.string().email("Email inválido").optional(),
  phone: z
    .string()
    .min(10, "Telefone deve ter no mínimo 10 dígitos")
    .optional(),
  address: addressSchema,
  totalDebt: z.number().min(0, "Valor da dívida não pode ser negativo"),
  status: z.enum(["active", "inactive"] as const).default("active"),
  observations: z.string().optional(),
});

const updateClientSchema = createClientSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido para atualização",
  });

export class LegacyClientController {
  private legacyClientService: LegacyClientService;

  constructor() {
    this.legacyClientService = new LegacyClientService();
  }

  async createLegacyClient(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createClientSchema.parse(req.body);

      const client =
        await this.legacyClientService.createLegacyClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof LegacyClientError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getLegacyClientById(req: Request, res: Response): Promise<void> {
    try {
      const client = await this.legacyClientService.getLegacyClientById(
        req.params.id
      );
      res.status(200).json(client);
    } catch (error) {
      if (error instanceof LegacyClientError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async findByDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = String(req.query.document).replace(/\D/g, "");
      const client = await this.legacyClientService.findByDocument(documentId);
      res.status(200).json(client);
    } catch (error) {
      if (error instanceof LegacyClientError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getAllLegacyClients(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const filters: Partial<ILegacyClient> = {};

      if (req.query.status) {
        const status = String(req.query.status);
        if (["active", "inactive"].includes(status)) {
          filters.status = status as "active" | "inactive";
        }
      }

      const result = await this.legacyClientService.getAllLegacyClients(
        page,
        limit,
        filters
      );

      res.status(200).json({
        clients: result.clients,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      if (error instanceof LegacyClientError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateLegacyClient(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = updateClientSchema.parse(req.body);

      const client = await this.legacyClientService.updateLegacyClient(
        req.params.id,
        validatedData
      );

      res.status(200).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof LegacyClientError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getDebtors(req: Request, res: Response): Promise<void> {
    try {
      const minDebt = req.query.minDebt ? Number(req.query.minDebt) : undefined;
      const maxDebt = req.query.maxDebt ? Number(req.query.maxDebt) : undefined;

      const debtors = await this.legacyClientService.getDebtors(
        minDebt,
        maxDebt
      );
      res.status(200).json(debtors);
    } catch (error) {
      if (error instanceof LegacyClientError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getPaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate
        ? new Date(String(req.query.startDate))
        : undefined;
      const endDate = req.query.endDate
        ? new Date(String(req.query.endDate))
        : undefined;

      const history = await this.legacyClientService.getPaymentHistory(
        req.params.id,
        startDate,
        endDate
      );

      res.status(200).json(history);
    } catch (error) {
      if (error instanceof LegacyClientError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async toggleClientStatus(req: Request, res: Response): Promise<void> {
    try {
      const client = await this.legacyClientService.toggleClientStatus(
        req.params.id
      );
      res.status(200).json(client);
    } catch (error) {
      if (error instanceof LegacyClientError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
