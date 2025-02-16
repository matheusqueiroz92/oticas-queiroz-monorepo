import { ProductService, ProductError } from "../../../services/ProductService";
import { ProductModel } from "../../../models/ProductModel";
import type { IProduct, ICreateProductDTO } from "../../../interfaces/IProduct";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  // afterAll,
  jest,
} from "@jest/globals";

interface MockProductModel extends ProductModel {
  findByName: jest.MockedFunction<ProductModel["findByName"]>;
  create: jest.MockedFunction<ProductModel["create"]>;
  findById: jest.MockedFunction<ProductModel["findById"]>;
  findAll: jest.MockedFunction<ProductModel["findAll"]>;
  update: jest.MockedFunction<ProductModel["update"]>;
  delete: jest.MockedFunction<ProductModel["delete"]>;
}

jest.mock("../../../models/ProductModel");

describe("ProductService", () => {
  let productService: ProductService;
  let productModel: jest.Mocked<ProductModel>;

  const mockProduct: ICreateProductDTO = {
    name: "Óculos de Sol Ray-Ban",
    category: "solar",
    description: "Óculos de sol estiloso",
    brand: "Ray-Ban",
    modelGlasses: "Aviador",
    price: 599.99,
    stock: 10,
  };

  beforeEach(() => {
    productModel = new ProductModel() as jest.Mocked<ProductModel>;
    productService = new ProductService();
    Object.defineProperty(productService, "productModel", {
      value: productModel,
      writable: true,
    });
  });

  describe("createProduct", () => {
    it("should create a product successfully", async () => {
      const mockCreatedProduct: IProduct = {
        _id: "product-id",
        ...mockProduct,
      };

      productModel.findByName.mockResolvedValue(null);
      productModel.create.mockResolvedValue(mockCreatedProduct);

      const result = await productService.createProduct(mockProduct);

      expect(result).toEqual(mockCreatedProduct);
      expect(productModel.findByName).toHaveBeenCalledWith(mockProduct.name);
      expect(productModel.create).toHaveBeenCalledWith(mockProduct);
    });

    it("should throw error if product already exists", async () => {
      productModel.findByName.mockResolvedValue({
        _id: "existing-id",
        ...mockProduct,
      });

      await expect(productService.createProduct(mockProduct)).rejects.toThrow(
        new ProductError("Produto já cadastrado com este nome")
      );
    });

    it("should throw error if price is negative", async () => {
      await expect(
        productService.createProduct({ ...mockProduct, price: -10 })
      ).rejects.toThrow(new ProductError("Preço não pode ser negativo"));
    });

    it("should throw error if stock is negative", async () => {
      await expect(
        productService.createProduct({ ...mockProduct, stock: -1 })
      ).rejects.toThrow(new ProductError("Estoque não pode ser negativo"));
    });
  });

  describe("getAllProducts", () => {
    it("should return all products with pagination", async () => {
      const mockProducts = {
        products: [{ _id: "1", ...mockProduct }],
        total: 1,
      };

      productModel.findAll.mockResolvedValue(mockProducts);

      const result = await productService.getAllProducts(1, 10);

      expect(result).toEqual(mockProducts);
      expect(productModel.findAll).toHaveBeenCalledWith(1, 10, {});
    });

    it("should throw error when no products found", async () => {
      productModel.findAll.mockResolvedValue({ products: [], total: 0 });

      await expect(productService.getAllProducts()).rejects.toThrow(
        new ProductError("Nenhum produto encontrado")
      );
    });
  });

  describe("getProductById", () => {
    it("should return product by id", async () => {
      const mockFoundProduct = { _id: "product-id", ...mockProduct };
      productModel.findById.mockResolvedValue(mockFoundProduct);

      const result = await productService.getProductById("product-id");

      expect(result).toEqual(mockFoundProduct);
    });

    it("should throw error if product not found", async () => {
      productModel.findById.mockResolvedValue(null);

      await expect(
        productService.getProductById("non-existent")
      ).rejects.toThrow(new ProductError("Produto não encontrado"));
    });
  });

  describe("updateProduct", () => {
    it("should update product successfully", async () => {
      const updateData = { price: 699.99, stock: 15 };
      const mockUpdatedProduct = {
        _id: "product-id",
        ...mockProduct,
        ...updateData,
      };

      productModel.update.mockResolvedValue(mockUpdatedProduct);

      const result = await productService.updateProduct(
        "product-id",
        updateData
      );

      expect(result).toEqual(mockUpdatedProduct);
    });

    it("should throw error when updating with existing name", async () => {
      productModel.findByName.mockResolvedValue({
        _id: "other-id",
        ...mockProduct,
      });

      await expect(
        productService.updateProduct("product-id", { name: mockProduct.name })
      ).rejects.toThrow(new ProductError("Já existe um produto com este nome"));
    });

    it("should throw error when product not found", async () => {
      productModel.update.mockResolvedValue(null);

      await expect(
        productService.updateProduct("non-existent", { price: 699.99 })
      ).rejects.toThrow(new ProductError("Produto não encontrado"));
    });
  });

  describe("deleteProduct", () => {
    it("should delete product successfully", async () => {
      const mockDeletedProduct = { _id: "product-id", ...mockProduct };
      productModel.delete.mockResolvedValue(mockDeletedProduct);

      const result = await productService.deleteProduct("product-id");

      expect(result).toEqual(mockDeletedProduct);
    });

    it("should throw error when product not found", async () => {
      productModel.delete.mockResolvedValue(null);

      await expect(
        productService.deleteProduct("non-existent")
      ).rejects.toThrow(new ProductError("Produto não encontrado"));
    });
  });
});
