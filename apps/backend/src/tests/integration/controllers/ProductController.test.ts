import request from "supertest";
import app from "../../../app";
import { Product } from "../../../schemas/ProductSchema";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import mongoose, { mongo } from "mongoose";
import type { ICreateProductDTO } from "../../../interfaces/IProduct";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  // afterEach,
  afterAll,
  // jest,
} from "@jest/globals";

config();

describe("ProductController", () => {
  let adminToken: string;
  let employeeToken: string;
  const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";

  const mockProduct: ICreateProductDTO = {
    name: "Óculos de Sol Ray-Ban",
    category: "solar",
    description: "Óculos de sol estiloso",
    brand: "Ray-Ban",
    modelGlasses: "Aviador",
    price: 599.99,
    stock: 10,
  };

  beforeAll(async () => {
    await mongoose.connect(mongoURI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});

    const admin = await User.create({
      name: "Admin Test",
      email: "admin@test.com",
      password: await bcrypt.hash("123456", 10),
      role: "admin",
    });
    adminToken = generateToken(admin._id.toString(), "admin");

    const employee = await User.create({
      name: "Employee Test",
      email: "employee@test.com",
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });
    employeeToken = generateToken(employee._id.toString(), "employee");
  });

  describe("POST /api/products", () => {
    it("should create a product when admin", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(mockProduct);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.name).toBe(mockProduct.name);
    });

    it("should create a product when employee", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(mockProduct);

      expect(res.status).toBe(201);
    });

    it("should not create product without authorization", async () => {
      const res = await request(app).post("/api/products").send(mockProduct);

      expect(res.status).toBe(401);
    });

    it("should not create product with invalid data", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...mockProduct, price: -10 });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/products", () => {
    it("should get all products with pagination", async () => {
      await Product.create(mockProduct);

      const res = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it("should filter products by category", async () => {
      await Product.create(mockProduct);
      await Product.create({
        ...mockProduct,
        name: "Óculos de Grau",
        category: "grau",
      });

      const res = await request(app)
        .get("/api/products?category=solar")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].category).toBe("solar");
    });
  });

  describe("GET /api/products/:id", () => {
    it("should get a product by id", async () => {
      const product = await Product.create(mockProduct);

      const res = await request(app)
        .get(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(mockProduct.name);
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app)
        .get(`/api/products/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should update a product", async () => {
      const product = await Product.create(mockProduct);
      const updateData = { price: 699.99 };

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(updateData.price);
    });

    it("should not update with invalid data", async () => {
      const product = await Product.create(mockProduct);

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ price: -10 });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("should delete a product", async () => {
      const product = await Product.create(mockProduct);

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app)
        .delete(`/api/products/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
