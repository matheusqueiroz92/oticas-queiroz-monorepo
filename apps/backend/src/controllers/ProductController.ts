import type { Request, Response } from "express";
import { ProductService, ProductError } from "../services/ProductService";
import { z } from "zod";
import type { ICreateProductDTO } from "../interfaces/IProduct";

const createProductSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  category: z.enum(["solar", "grau"], {
    errorMap: () => ({ message: "Categoria deve ser 'solar' ou 'grau'" }),
  }),
  description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  brand: z.string().min(2, "Marca deve ter no mínimo 2 caracteres"),
  modelGlasses: z.string().min(2, "Modelo deve ter no mínimo 2 caracteres"),
  price: z.number().positive("Preço deve ser positivo"),
  stock: z.number().min(0, "Estoque não pode ser negativo"),
});

const updateProductSchema = createProductSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Pelo menos um campo deve ser fornecido para atualização"
  );

type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createProductSchema.parse(req.body);
      const product = await this.productService.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof ProductError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const filters: Partial<ICreateProductDTO> = {};

      // Filtros opcionais
      if (req.query.category) filters.category = String(req.query.category);
      if (req.query.brand) filters.brand = String(req.query.brand);
      if (req.query.modelGlasses)
        filters.modelGlasses = String(req.query.modelGlasses);

      const { products, total } = await this.productService.getAllProducts(
        page,
        limit,
        filters
      );

      res.status(200).json({
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof ProductError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.productService.getProductById(req.params.id);
      res.status(200).json(product);
    } catch (error) {
      if (error instanceof ProductError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = updateProductSchema.parse(req.body);
      const product = await this.productService.updateProduct(
        req.params.id,
        validatedData
      );
      res.status(200).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof ProductError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      await this.productService.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ProductError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
