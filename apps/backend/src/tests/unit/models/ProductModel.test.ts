import { ProductModel } from "../../../models/ProductModel";
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
  // afterEach,
  afterAll,
} from "@jest/globals";

config();

describe("ProductModel", () => {
  let productModel: ProductModel;
  const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";

  beforeAll(async () => {
    await mongoose.connect(mongoURI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    productModel = new ProductModel();
    await Product.deleteMany({});
  });

  const mockProduct: ICreateProductDTO = {
    name: "Óculos de Sol Ray-Ban",
    category: "solar",
    description: "Óculos de sol estiloso",
    brand: "Ray-Ban",
    modelGlasses: "Aviador",
    price: 599.99,
    stock: 10,
  };

  describe("create", () => {
    it("should create a product", async () => {
      const product = await productModel.create(mockProduct);

      expect(product).toHaveProperty("_id");
      expect(product.name).toBe(mockProduct.name);
      expect(product.price).toBe(mockProduct.price);
    });
  });

  describe("findByName", () => {
    it("should find a product by name", async () => {
      await productModel.create(mockProduct);
      const product = await productModel.findByName(mockProduct.name);

      expect(product).toBeTruthy();
      expect(product?.name).toBe(mockProduct.name);
    });

    it("should return null if product not found", async () => {
      const product = await productModel.findByName("Non-existent Product");
      expect(product).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find a product by id", async () => {
      const createdProduct = await productModel.create(mockProduct);
      const product = await productModel.findById(createdProduct._id);

      expect(product).toBeTruthy();
      expect(product?._id).toBe(createdProduct._id);
    });

    it("should return null for invalid id", async () => {
      const product = await productModel.findById("invalid-id");
      expect(product).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all products with pagination", async () => {
      await productModel.create(mockProduct);
      await productModel.create({
        ...mockProduct,
        name: "Óculos de Sol 2",
      });

      const result = await productModel.findAll(1, 10);

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should return filtered products", async () => {
      await productModel.create(mockProduct);
      await productModel.create({
        ...mockProduct,
        name: "Óculos de Grau",
        category: "grau",
      });

      const result = await productModel.findAll(1, 10, { category: "solar" });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].category).toBe("solar");
    });
  });

  describe("update", () => {
    it("should update a product", async () => {
      const createdProduct = await productModel.create(mockProduct);
      const updatedProduct = await productModel.update(createdProduct._id, {
        price: 699.99,
        stock: 15,
      });

      expect(updatedProduct?.price).toBe(699.99);
      expect(updatedProduct?.stock).toBe(15);
    });

    it("should return null for non-existent product", async () => {
      const result = await productModel.update(
        new mongoose.Types.ObjectId().toString(),
        { price: 699.99 }
      );
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a product", async () => {
      const createdProduct = await productModel.create(mockProduct);
      const deletedProduct = await productModel.delete(createdProduct._id);

      expect(deletedProduct?._id).toBe(createdProduct._id);

      const findProduct = await productModel.findById(createdProduct._id);
      expect(findProduct).toBeNull();
    });

    it("should return null for non-existent product", async () => {
      const result = await productModel.delete(
        new mongoose.Types.ObjectId().toString()
      );
      expect(result).toBeNull();
    });
  });

  describe("updateStock", () => {
    it("should update product stock", async () => {
      const createdProduct = await productModel.create(mockProduct);
      const updatedProduct = await productModel.updateStock(
        createdProduct._id,
        5
      );

      expect(updatedProduct?.stock).toBe(mockProduct.stock + 5);
    });

    it("should return null for non-existent product", async () => {
      const result = await productModel.updateStock(
        new mongoose.Types.ObjectId().toString(),
        5
      );
      expect(result).toBeNull();
    });
  });
});
