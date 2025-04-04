import type { Request, Response } from "express";
import { ProductService, ProductError } from "../services/ProductService";
import { StockService } from "../services/StockService";
import { JwtPayload } from 'jsonwebtoken';
import { z } from "zod";
import { 
  lensSchema, 
  cleanLensSchema,
  prescriptionFrameSchema, 
  sunglassesFrameSchema 
} from '../validators/productValidators';

interface AuthRequest extends Request {
  user?: JwtPayload & { id?: string; role?: string };
}

export class ProductController {
  private productService: ProductService;
  private stockService: StockService;

  constructor() {
    this.productService = new ProductService();
    this.stockService = new StockService();
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      if (req.file) {
        data.image = `/images/products/${req.file.filename}`;
      }

      if (data.sellPrice) data.sellPrice = Number(data.sellPrice);
      if (data.costPrice) data.costPrice = Number(data.costPrice);

      if (data.stock !== undefined) {
        data.stock = Number(data.stock);
      }
      
      let validatedData: any;
      switch (data.productType) {
        case 'lenses':
          validatedData = lensSchema.parse(data);
          break;
        case 'clean_lenses':
          validatedData = cleanLensSchema.parse(data);
          break;
        case 'prescription_frame':
          validatedData = prescriptionFrameSchema.parse(data);
          break;
        case 'sunglasses_frame':
          validatedData = sunglassesFrameSchema.parse(data);
          break;
        default:
          throw new Error(`Tipo de produto inválido: ${data.productType}`);
      }

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
      const filters: any = {};

      if (req.query.productType) filters.productType = String(req.query.productType);
      if (req.query.brand) filters.brand = String(req.query.brand);
      if (req.query.minSellPrice) filters.sellPrice = { $gte: Number(req.query.minSellPrice) };
      if (req.query.maxSellPrice) {
        if (filters.sellPrice) {
          filters.sellPrice.$lte = Number(req.query.maxSellPrice);
        } else {
          filters.sellPrice = { $lte: Number(req.query.maxSellPrice) };
        }
      }
      
      if (req.query.lensType) filters.lensType = String(req.query.lensType);
      if (req.query.typeFrame) filters.typeFrame = String(req.query.typeFrame);
      if (req.query.color) filters.color = String(req.query.color);
      if (req.query.shape) filters.shape = String(req.query.shape);
      if (req.query.reference) filters.reference = String(req.query.reference);
      if (req.query.model) filters.model = String(req.query.model);

      if (req.query.search) {
        const searchRegex = new RegExp(String(req.query.search), 'i');
        filters.$or = [
          { name: searchRegex },
          { description: searchRegex }
        ];
      }

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
      console.error("Error fetching products:", error);
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
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const updateData: any = {};
      const data = req.body;

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.brand !== undefined) updateData.brand = data.brand;
      if (data.sellPrice !== undefined) updateData.sellPrice = Number(data.sellPrice);
      if (data.costPrice !== undefined) updateData.costPrice = Number(data.costPrice);
      if (data.stock !== undefined) {
        updateData.stock = Number(data.stock);
      }
      
      const originalProduct = await this.productService.getProductById(req.params.id);
      
      switch (originalProduct.productType) {
        case 'lenses':
          if (data.lensType !== undefined) updateData.lensType = data.lensType;
          break;
        case 'prescription_frame':
        case 'sunglasses_frame':
          if (data.typeFrame !== undefined) updateData.typeFrame = data.typeFrame;
          if (data.color !== undefined) updateData.color = data.color;
          if (data.shape !== undefined) updateData.shape = data.shape;
          if (data.reference !== undefined) updateData.reference = data.reference;
          
          if (originalProduct.productType === 'sunglasses_frame' && data.modelSunglasses !== undefined) {
            updateData.modelSunglasses = data.modelSunglasses;
          }
          break;
      }

      if (req.file) {
        updateData.image = `/images/products/${req.file.filename}`;
      }

      const product = await this.productService.updateProduct(
        req.params.id,
        updateData
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
      console.error("Error updating product:", error);
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
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateProductStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      const { stock } = req.body;
      
      if (stock === undefined || isNaN(Number(stock))) {
        res.status(400).json({ message: "Valor de estoque inválido" });
        return;
      }
      
      const stockValue = Number(stock);
      
      // Buscar o produto antes de atualizar para saber o estoque anterior
      const currentProduct = await this.productService.getProductById(productId);
      if (!currentProduct) {
        res.status(404).json({ message: "Produto não encontrado" });
        return;
      }
      
      // Verificar se é um produto com controle de estoque
      if (currentProduct.productType !== 'prescription_frame' && currentProduct.productType !== 'sunglasses_frame') {
        res.status(400).json({ message: "Este produto não possui controle de estoque" });
        return;
      }
      
      const previousStock = (currentProduct as any).stock || 0;
      
      // Atualizar o estoque no banco de dados
      const product = await this.productService.updateProduct(productId, { stock: stockValue });
      
      // Registrar a alteração no log de estoque
      try {
        const operation = stockValue > previousStock ? 'increase' : 'decrease';
        const difference = Math.abs(stockValue - previousStock);
        const reason = `Ajuste manual de estoque: ${previousStock} → ${stockValue}`;
        
        await this.stockService.createStockLog(
          productId,
          previousStock,
          stockValue,
          difference,
          operation,
          reason,
          req.user?.id || 'system',
        );
        
        console.log(`Estoque do produto ${productId} atualizado de ${previousStock} para ${stockValue}`);
      } catch (stockError) {
        console.error('Erro ao registrar log de estoque:', stockError);
        // Não impedir a atualização do produto se o log falhar
      }
      
      res.status(200).json(product);
    } catch (error) {
      if (error instanceof ProductError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error updating product stock:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getProductStockHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const productId = req.params.id;
      
      // Verificar se o produto existe
      const product = await this.productService.getProductById(productId);
      if (!product) {
        res.status(404).json({ message: "Produto não encontrado" });
        return;
      }
      
      // Verificar se é um produto com controle de estoque (armação)
      if (product.productType !== 'prescription_frame' && product.productType !== 'sunglasses_frame') {
        res.status(400).json({ 
          message: "Este produto não possui controle de estoque. Apenas armações possuem histórico de estoque."
        });
        return;
      }
      
      try {
        // Chamar método estático no modelo StockLog para buscar histórico
        const stockHistory = await this.stockService.getProductStockHistory(productId);
        res.status(200).json(stockHistory);
      } catch (error) {
        console.error("Erro ao buscar histórico de estoque:", error);
        res.status(500).json({ 
          message: "Erro ao buscar histórico de estoque",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      console.error("Erro ao buscar histórico de estoque do produto:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}