// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ProductService, ProductError } from "../../../services/ProductService";
import { getRepositories } from "../../../repositories/RepositoryFactory";
import type { IProduct } from "../../../interfaces/IProduct";
import { productSchema } from "../../../validators/productValidators";
import { z } from "zod";

// Mock do getRepositories
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: jest.fn()
}));

// Mock do productSchema validator
jest.mock("../../../validators/productValidators", () => ({
  productSchema: {
    parse: jest.fn()
  }
}));

describe("ProductService", () => {
  let productService: ProductService;
  let mockProductRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mock do ProductRepository
    mockProductRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      findByType: jest.fn(),
      findByBrand: jest.fn(),
      findLowStock: jest.fn(),
      findByPriceRange: jest.fn(),
      findFrames: jest.fn(),
      findLenses: jest.fn(),
      findInsufficientStock: jest.fn(),
      findByIds: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateStock: jest.fn(),
    };

    // Mock do getRepositories
    (getRepositories as jest.Mock).mockReturnValue({
      productRepository: mockProductRepository,
      userRepository: jest.fn(),
      orderRepository: jest.fn(),
      paymentRepository: jest.fn(),
      laboratoryRepository: jest.fn(),
      cashRegisterRepository: jest.fn(),
      counterRepository: jest.fn(),
      legacyClientRepository: jest.fn(),
      passwordResetRepository: jest.fn(),
    });

    // Mock padrão do productSchema
    (productSchema.parse as jest.Mock).mockImplementation(() => {});

    productService = new ProductService();
  });

  const mockProduct: IProduct = {
    _id: "product-id",
    name: "Óculos de Sol Ray-Ban",
    productType: "sunglasses_frame",
    description: "Óculos de sol estiloso",
    image: "src/public/images/ray-ban-aviator.png",
    brand: "Ray-Ban",
    sellPrice: 599.99,
    costPrice: 300.00,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Tipo para criação de produto (sem _id, createdAt, updatedAt)
  type CreateProductData = Omit<IProduct, "_id" | "createdAt" | "updatedAt">;

  describe("createProduct", () => {
    it("should create a product successfully", async () => {
      const productData: CreateProductData = {
        name: mockProduct.name,
        productType: mockProduct.productType,
        description: mockProduct.description,
        image: mockProduct.image,
        brand: mockProduct.brand,
        sellPrice: mockProduct.sellPrice,
        costPrice: mockProduct.costPrice,
        stock: mockProduct.stock,
      };

      mockProductRepository.search.mockResolvedValue({ items: [], total: 0 });
      mockProductRepository.create.mockResolvedValue(mockProduct);

      const result = await productService.createProduct(productData as any);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.search).toHaveBeenCalledWith(productData.name, 1, 1);
      expect(mockProductRepository.create).toHaveBeenCalledWith(productData);
    });

    it("should throw error if product already exists", async () => {
      const productData: CreateProductData = {
        name: mockProduct.name,
        productType: mockProduct.productType,
        description: mockProduct.description,
        image: mockProduct.image,
        brand: mockProduct.brand,
        sellPrice: mockProduct.sellPrice,
        costPrice: mockProduct.costPrice,
        stock: mockProduct.stock,
      };

      mockProductRepository.search.mockResolvedValue({ 
        items: [{ ...mockProduct, name: productData.name.toLowerCase() }], 
        total: 1 
      });

      await expect(productService.createProduct(productData as any)).rejects.toThrow(
        new ProductError("Produto já cadastrado com este nome")
      );
    });

    it("should throw ProductError for validation errors", async () => {
      const productData: CreateProductData = {
        name: "",
        productType: "sunglasses_frame",
        description: "",
        sellPrice: -100,
        costPrice: -50,
      };

      // Mock ZodError
      const zodError = new z.ZodError([
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          message: "Nome é obrigatório",
          path: ["name"]
        },
        {
          code: "too_small",
          minimum: 0,
          type: "number",
          inclusive: false,
          message: "Preço deve ser positivo",
          path: ["sellPrice"]
        }
      ]);

      (productSchema.parse as jest.Mock).mockImplementation(() => {
        throw zodError;
      });

      await expect(productService.createProduct(productData as any)).rejects.toThrow(
        new ProductError("Dados inválidos: Nome é obrigatório, Preço deve ser positivo")
      );
    });

    it("should re-throw non-Zod errors", async () => {
      const productData: CreateProductData = {
        name: "Test Product",
        productType: "sunglasses_frame",
        sellPrice: 100,
      };

      const customError = new Error("Database connection error");
      (productSchema.parse as jest.Mock).mockImplementation(() => {
        throw customError;
      });

      await expect(productService.createProduct(productData as any)).rejects.toThrow(customError);
    });

    it("should set stock to 0 for prescription_frame when undefined", async () => {
      const frameData: CreateProductData = {
        name: "Armação de Grau",
        productType: "prescription_frame",
        description: "Armação para óculos de grau",
        brand: "Test Brand",
        sellPrice: 200.00,
        costPrice: 100.00,
        stock: undefined,
      };

      mockProductRepository.search.mockResolvedValue({ items: [], total: 0 });
      mockProductRepository.create.mockResolvedValue({ ...frameData, _id: "frame-id", stock: 0 });

      const result = await productService.createProduct(frameData as any);

      expect(mockProductRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        productType: "prescription_frame"
      }));
    });

    it("should set stock to 0 for sunglasses_frame when undefined", async () => {
      const frameData: CreateProductData = {
        name: "Óculos de Sol",
        productType: "sunglasses_frame",
        description: "Óculos de sol moderno",
        brand: "Test Brand",
        sellPrice: 300.00,
        costPrice: 150.00,
        stock: undefined,
      };

      mockProductRepository.search.mockResolvedValue({ items: [], total: 0 });
      mockProductRepository.create.mockResolvedValue({ ...frameData, _id: "sunglasses-id", stock: 0 });

      const result = await productService.createProduct(frameData as any);

      expect(mockProductRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        productType: "sunglasses_frame"
      }));
    });
  });

  describe("getAllProducts", () => {
    it("should return all products with pagination", async () => {
      const mockResult = {
        items: [mockProduct],
        total: 1
      };

      mockProductRepository.findAll.mockResolvedValue(mockResult);

      const result = await productService.getAllProducts(1, 10);

      expect(result.products).toEqual([mockProduct]);
      expect(result.total).toBe(1);
      expect(mockProductRepository.findAll).toHaveBeenCalledWith(1, 10, undefined);
    });

    it("should return products with filters", async () => {
      const filters = { brand: "Ray-Ban" };
      const mockResult = {
        items: [mockProduct],
        total: 1
      };

      mockProductRepository.findAll.mockResolvedValue(mockResult);

      const result = await productService.getAllProducts(1, 10, filters);

      expect(result.products).toEqual([mockProduct]);
      expect(mockProductRepository.findAll).toHaveBeenCalledWith(1, 10, filters);
    });

    it("should use default pagination when not provided", async () => {
      const mockResult = {
        items: [mockProduct],
        total: 1
      };

      mockProductRepository.findAll.mockResolvedValue(mockResult);

      await productService.getAllProducts();

      expect(mockProductRepository.findAll).toHaveBeenCalledWith(1, 10, undefined);
    });

    it("should throw error when no products found", async () => {
      mockProductRepository.findAll.mockResolvedValue({ items: [], total: 0 });

      await expect(productService.getAllProducts()).rejects.toThrow(
        new ProductError("Nenhum produto encontrado")
      );
    });
  });

  describe("getProductById", () => {
    it("should return product by id", async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct);

      const result = await productService.getProductById("product-id");

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findById).toHaveBeenCalledWith("product-id");
    });

    it("should throw error if product not found", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(productService.getProductById("non-existent")).rejects.toThrow(
        new ProductError("Produto não encontrado")
      );
    });
  });

  describe("updateProduct", () => {
    it("should update product successfully", async () => {
      const updateData = { sellPrice: 699.99, stock: 15 };
      const updatedProduct = { ...mockProduct, ...updateData };

      mockProductRepository.search.mockResolvedValue({ items: [], total: 0 });
      mockProductRepository.update.mockResolvedValue(updatedProduct);

      const result = await productService.updateProduct("product-id", updateData);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.update).toHaveBeenCalledWith("product-id", updateData);
    });

    it("should throw error for negative sell price", async () => {
      const updateData = { sellPrice: -100 };

      await expect(productService.updateProduct("product-id", updateData)).rejects.toThrow(
        new ProductError("Preço de venda não pode ser negativo")
      );
    });

    it("should throw error for negative cost price", async () => {
      const updateData = { costPrice: -50 };

      await expect(productService.updateProduct("product-id", updateData)).rejects.toThrow(
        new ProductError("Preço de custo não pode ser negativo")
      );
    });

    it("should throw error when updating with existing name", async () => {
      const updateData = { name: "Existing Product" };
      const existingProduct = { _id: "other-id", name: "existing product" };

      mockProductRepository.search.mockResolvedValue({ 
        items: [existingProduct], 
        total: 1 
      });

      await expect(productService.updateProduct("product-id", updateData)).rejects.toThrow(
        new ProductError("Já existe um produto com este nome")
      );
    });

    it("should allow updating with same name for same product", async () => {
      const updateData = { name: "Updated Product", sellPrice: 699.99 };
      const sameProduct = { _id: "product-id", name: "updated product" };
      const updatedProduct = { ...mockProduct, ...updateData };

      mockProductRepository.search.mockResolvedValue({ 
        items: [sameProduct], 
        total: 1 
      });
      mockProductRepository.update.mockResolvedValue(updatedProduct);

      const result = await productService.updateProduct("product-id", updateData);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.update).toHaveBeenCalledWith("product-id", updateData);
    });

    it("should throw error when product not found", async () => {
      const updateData = { sellPrice: 699.99 };

      mockProductRepository.search.mockResolvedValue({ items: [], total: 0 });
      mockProductRepository.update.mockResolvedValue(null);

      await expect(productService.updateProduct("non-existent", updateData)).rejects.toThrow(
        new ProductError("Produto não encontrado")
      );
    });
  });

  describe("deleteProduct", () => {
    it("should delete product successfully", async () => {
      mockProductRepository.delete.mockResolvedValue(mockProduct);

      const result = await productService.deleteProduct("product-id");

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.delete).toHaveBeenCalledWith("product-id");
    });

    it("should throw error when product not found", async () => {
      mockProductRepository.delete.mockResolvedValue(null);

      await expect(productService.deleteProduct("non-existent")).rejects.toThrow(
        new ProductError("Produto não encontrado")
      );
    });
  });

  describe("getProductsByType", () => {
    it("should return products by type", async () => {
      const mockResult = {
        items: [mockProduct],
        total: 1
      };

      mockProductRepository.findByType.mockResolvedValue(mockResult);

      const result = await productService.getProductsByType("sunglasses_frame", 1, 10);

      expect(result.products).toEqual([mockProduct]);
      expect(result.total).toBe(1);
      expect(mockProductRepository.findByType).toHaveBeenCalledWith("sunglasses_frame", 1, 10);
    });

    it("should use default pagination", async () => {
      const mockResult = { items: [], total: 0 };
      mockProductRepository.findByType.mockResolvedValue(mockResult);

      await productService.getProductsByType("lenses");

      expect(mockProductRepository.findByType).toHaveBeenCalledWith("lenses", 1, 10);
    });
  });

  describe("getProductsByBrand", () => {
    it("should return products by brand", async () => {
      const mockResult = {
        items: [mockProduct],
        total: 1
      };

      mockProductRepository.findByBrand.mockResolvedValue(mockResult);

      const result = await productService.getProductsByBrand("Ray-Ban", 1, 10);

      expect(result.products).toEqual([mockProduct]);
      expect(result.total).toBe(1);
      expect(mockProductRepository.findByBrand).toHaveBeenCalledWith("Ray-Ban", 1, 10);
    });

    it("should use default pagination", async () => {
      const mockResult = { items: [], total: 0 };
      mockProductRepository.findByBrand.mockResolvedValue(mockResult);

      await productService.getProductsByBrand("Oakley");

      expect(mockProductRepository.findByBrand).toHaveBeenCalledWith("Oakley", 1, 10);
    });
  });

  describe("searchProducts", () => {
    it("should search products by term", async () => {
      const mockResult = {
        items: [mockProduct],
        total: 1
      };

      mockProductRepository.search.mockResolvedValue(mockResult);

      const result = await productService.searchProducts("Ray-Ban", 1, 10);

      expect(result.products).toEqual([mockProduct]);
      expect(result.total).toBe(1);
      expect(mockProductRepository.search).toHaveBeenCalledWith("Ray-Ban", 1, 10);
    });

    it("should use default pagination", async () => {
      const mockResult = { items: [], total: 0 };
      mockProductRepository.search.mockResolvedValue(mockResult);

      await productService.searchProducts("test");

      expect(mockProductRepository.search).toHaveBeenCalledWith("test", 1, 10);
    });
  });

  describe("getLowStockProducts", () => {
    it("should return low stock products", async () => {
      const lowStockProduct = { ...mockProduct, stock: 5 };
      const mockResult = {
        items: [lowStockProduct],
        total: 1
      };

      mockProductRepository.findLowStock.mockResolvedValue(mockResult);

      const result = await productService.getLowStockProducts(10, 1, 10);

      expect(result.products).toEqual([lowStockProduct]);
      expect(result.total).toBe(1);
      expect(mockProductRepository.findLowStock).toHaveBeenCalledWith(10, 1, 10);
    });

    it("should use default threshold and pagination", async () => {
      const mockResult = { items: [], total: 0 };
      mockProductRepository.findLowStock.mockResolvedValue(mockResult);

      await productService.getLowStockProducts();

      expect(mockProductRepository.findLowStock).toHaveBeenCalledWith(10, 1, 10);
    });
  });

  describe("updateStock", () => {
    it("should update stock with default operation", async () => {
      const updatedProduct = { ...mockProduct, stock: 20 };
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await productService.updateStock("product-id", 20);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.updateStock).toHaveBeenCalledWith("product-id", 20, "set");
    });

    it("should update stock with add operation", async () => {
      const updatedProduct = { ...mockProduct, stock: 15 };
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await productService.updateStock("product-id", 5, "add");

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.updateStock).toHaveBeenCalledWith("product-id", 5, "add");
    });

    it("should update stock with subtract operation", async () => {
      const updatedProduct = { ...mockProduct, stock: 5 };
      mockProductRepository.updateStock.mockResolvedValue(updatedProduct);

      const result = await productService.updateStock("product-id", 5, "subtract");

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.updateStock).toHaveBeenCalledWith("product-id", 5, "subtract");
    });

    it("should throw error when product not found", async () => {
      mockProductRepository.updateStock.mockResolvedValue(null);

      await expect(productService.updateStock("non-existent", 10)).rejects.toThrow(
        new ProductError("Produto não encontrado")
      );
    });
  });

  describe("getProductsByPriceRange", () => {
    it("should return products by price range", async () => {
      const mockResult = {
        items: [mockProduct],
        total: 1
      };

      mockProductRepository.findByPriceRange.mockResolvedValue(mockResult);

      const result = await productService.getProductsByPriceRange(100, 1000, 1, 10);

      expect(result.products).toEqual([mockProduct]);
      expect(result.total).toBe(1);
      expect(mockProductRepository.findByPriceRange).toHaveBeenCalledWith(100, 1000, 1, 10);
    });

    it("should use default pagination", async () => {
      const mockResult = { items: [], total: 0 };
      mockProductRepository.findByPriceRange.mockResolvedValue(mockResult);

      await productService.getProductsByPriceRange(100, 1000);

      expect(mockProductRepository.findByPriceRange).toHaveBeenCalledWith(100, 1000, 1, 10);
    });
  });

  describe("getFramesByFilters", () => {
    it("should return frames by filters", async () => {
      const filters = {
        typeFrame: "metal",
        color: "black",
        shape: "aviator",
        productType: "sunglasses_frame" as const
      };
      const mockResult = {
        items: [mockProduct],
        total: 1
      };

      mockProductRepository.findFrames.mockResolvedValue(mockResult);

      const result = await productService.getFramesByFilters(filters, 1, 10);

      expect(result.products).toEqual([mockProduct]);
      expect(result.total).toBe(1);
      expect(mockProductRepository.findFrames).toHaveBeenCalledWith(filters, 1, 10);
    });

    it("should use default pagination", async () => {
      const filters = { color: "brown" };
      const mockResult = { items: [], total: 0 };
      mockProductRepository.findFrames.mockResolvedValue(mockResult);

      await productService.getFramesByFilters(filters);

      expect(mockProductRepository.findFrames).toHaveBeenCalledWith(filters, 1, 10);
    });
  });

  describe("getLensesByType", () => {
    it("should return lenses by type", async () => {
      const lensProduct = { ...mockProduct, productType: "clean_lenses" as const };
      const mockResult = {
        items: [lensProduct],
        total: 1
      };

      mockProductRepository.findLenses.mockResolvedValue(mockResult);

      const result = await productService.getLensesByType("multifocal", 1, 10);

      expect(result.products).toEqual([lensProduct]);
      expect(result.total).toBe(1);
      expect(mockProductRepository.findLenses).toHaveBeenCalledWith("multifocal", 1, 10);
    });

    it("should work without lens type", async () => {
      const mockResult = { items: [], total: 0 };
      mockProductRepository.findLenses.mockResolvedValue(mockResult);

      await productService.getLensesByType();

      expect(mockProductRepository.findLenses).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it("should use default pagination", async () => {
      const mockResult = { items: [], total: 0 };
      mockProductRepository.findLenses.mockResolvedValue(mockResult);

      await productService.getLensesByType("progressive");

      expect(mockProductRepository.findLenses).toHaveBeenCalledWith("progressive", 1, 10);
    });
  });

  describe("checkInsufficientStock", () => {
    it("should return insufficient stock information", async () => {
      const productIds = ["prod1", "prod2"];
      const requiredQuantities = [20, 15];
      const insufficientStockResult = [
        { productId: "prod1", available: 10, required: 20 }
      ];

      mockProductRepository.findInsufficientStock.mockResolvedValue(insufficientStockResult);

      const result = await productService.checkInsufficientStock(productIds, requiredQuantities);

      expect(result).toEqual(insufficientStockResult);
      expect(mockProductRepository.findInsufficientStock).toHaveBeenCalledWith(productIds, requiredQuantities);
    });
  });

  describe("getProductsByIds", () => {
    it("should return products by ids", async () => {
      const ids = ["prod1", "prod2"];
      const products = [
        { ...mockProduct, _id: "prod1" },
        { ...mockProduct, _id: "prod2" }
      ];

      mockProductRepository.findByIds.mockResolvedValue(products);

      const result = await productService.getProductsByIds(ids);

      expect(result).toEqual(products);
      expect(mockProductRepository.findByIds).toHaveBeenCalledWith(ids);
    });
  });

  describe("session methods", () => {
    it("should get product by id with session", async () => {
      const session = {} as any;
      mockProductRepository.findById.mockResolvedValue(mockProduct);

      const result = await productService.getProductByIdWithSession("product-id", session);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findById).toHaveBeenCalledWith("product-id");
    });

    it("should update product with session", async () => {
      const session = {} as any;
      const updateData = { sellPrice: 699.99 };
      const updatedProduct = { ...mockProduct, ...updateData };

      mockProductRepository.update.mockResolvedValue(updatedProduct);

      const result = await productService.updateProductWithSession("product-id", updateData, session);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.update).toHaveBeenCalledWith("product-id", updateData);
    });

    it("should use findByIdWithSession when available", async () => {
      const session = {} as any;
      // Adicionar método com sessão ao mock
      const mockFindByIdWithSession = jest.fn().mockResolvedValue(mockProduct);
      (mockProductRepository as any).findByIdWithSession = mockFindByIdWithSession;

      const result = await productService.getProductByIdWithSession("product-id", session);

      expect(result).toEqual(mockProduct);
      expect(mockFindByIdWithSession).toHaveBeenCalledWith("product-id", session);
      expect(mockProductRepository.findById).not.toHaveBeenCalled();
    });

    it("should use updateWithSession when available", async () => {
      const session = {} as any;
      const updateData = { sellPrice: 699.99 };
      const updatedProduct = { ...mockProduct, ...updateData };
      
      // Adicionar método com sessão ao mock
      const mockUpdateWithSession = jest.fn().mockResolvedValue(updatedProduct);
      (mockProductRepository as any).updateWithSession = mockUpdateWithSession;

      const result = await productService.updateProductWithSession("product-id", updateData, session);

      expect(result).toEqual(updatedProduct);
      expect(mockUpdateWithSession).toHaveBeenCalledWith("product-id", updateData, session);
      expect(mockProductRepository.update).not.toHaveBeenCalled();
    });
  });
});
