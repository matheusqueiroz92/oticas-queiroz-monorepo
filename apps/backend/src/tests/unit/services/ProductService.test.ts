import { ProductService } from "../../../services/ProductService";
import { Product } from "../../../schemas/ProductSchema";
import mongoose from "mongoose";
import { config } from "dotenv";
import type { ICreateProductDTO } from "../../../interfaces/IProduct";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterEach,
  afterAll,
} from "@jest/globals";

config();

describe("ProductService", () => {
  let productService: ProductService;
  const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";

  beforeEach(() => {
    productService = new ProductService();
  });

  beforeAll(async () => {
    await mongoose.connect(mongoURI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  describe("createProduct", () => {
    it("should create a product successfully", async () => {
      const productData: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      const product = await productService.createProduct(productData);

      expect(product).toHaveProperty("_id");
      expect(product.name).toBe(productData.name);
      expect(product.price).toBe(productData.price);
    });

    it("should throw error if product with same name already exists", async () => {
      const productData: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      await productService.createProduct(productData);

      await expect(productService.createProduct(productData)).rejects.toThrow(
        "Produto já cadastrado com este nome"
      );
    });
  });

  describe("getAllProducts", () => {
    it("should return all products", async () => {
      const productsData: ICreateProductDTO[] = [
        {
          name: "Óculos de Sol 1",
          description: "Descrição 1",
          price: 299.99,
          stock: 10,
          category: "solar",
        },
        {
          name: "Óculos de Sol 2",
          description: "Descrição 2",
          price: 399.99,
          stock: 5,
          category: "solar",
        },
      ];

      await Promise.all(
        productsData.map((data) => productService.createProduct(data))
      );

      const products = await productService.getAllProducts();

      expect(products).toHaveLength(2);
      expect(products[0]).toHaveProperty("_id");
      expect(products[1]).toHaveProperty("_id");
    });
  });

  describe("getProductById", () => {
    it("should return a product by id", async () => {
      const productData: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      const createdProduct = await productService.createProduct(productData);
      const foundProduct = await productService.getProductById(
        createdProduct._id
      );

      expect(foundProduct).toBeTruthy();
      expect(foundProduct?.name).toBe(productData.name);
    });

    it("should return null for non-existent product", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const product = await productService.getProductById(nonExistentId);

      expect(product).toBeNull();
    });
  });

  describe("updateProduct", () => {
    it("should update a product successfully", async () => {
      const productData: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      const createdProduct = await productService.createProduct(productData);
      const updateData = {
        price: 349.99,
        stock: 15,
      };

      const updatedProduct = await productService.updateProduct(
        createdProduct._id,
        updateData
      );

      expect(updatedProduct).toBeTruthy();
      expect(updatedProduct?.price).toBe(updateData.price);
      expect(updatedProduct?.stock).toBe(updateData.stock);
    });

    it("should throw error when updating with existing product name", async () => {
      const product1Data: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      const product2Data: ICreateProductDTO = {
        name: "Óculos de Grau",
        description: "Óculos para leitura",
        price: 399.99,
        stock: 5,
        category: "grau",
      };

      const product1 = await productService.createProduct(product1Data);
      await productService.createProduct(product2Data);

      await expect(
        productService.updateProduct(product1._id, { name: "Óculos de Grau" })
      ).rejects.toThrow("Já existe um produto com este nome");
    });
  });

  describe("deleteProduct", () => {
    it("should delete a product successfully", async () => {
      const productData: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      const product = await productService.createProduct(productData);
      const deletedProduct = await productService.deleteProduct(product._id);

      expect(deletedProduct).toBeTruthy();

      const foundProduct = await productService.getProductById(product._id);
      expect(foundProduct).toBeNull();
    });

    it("should return null when trying to delete non-existent product", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await productService.deleteProduct(nonExistentId);

      expect(result).toBeNull();
    });
  });
});
