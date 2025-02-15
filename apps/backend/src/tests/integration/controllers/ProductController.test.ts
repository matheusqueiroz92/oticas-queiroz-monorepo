import request from "supertest";
import app from "../../../app";
import { Product } from "../../../schemas/ProductSchema";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import mongoose from "mongoose";
import type { ICreateProductDTO } from "../../../interfaces/IProduct";
import bcrypt from "bcrypt";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from "@jest/globals";
import { config } from "dotenv";

config();

describe("ProductController", () => {
  let adminToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/test"
    );
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
    it("should create a new product when admin", async () => {
      const productData: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(productData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.name).toBe(productData.name);
    });

    it("should create a new product when employee", async () => {
      const productData: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(productData);

      expect(res.status).toBe(201);
    });

    it("should not create product without authorization", async () => {
      const productData: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      const res = await request(app).post("/api/products").send(productData);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/products", () => {
    it("should get all products", async () => {
      const productData: ICreateProductDTO = {
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      };

      await Product.create(productData);

      const res = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
    });

    it("should not get products without authorization", async () => {
      const res = await request(app).get("/api/products");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should get a product by id", async () => {
      const product = await Product.create({
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      });

      const res = await request(app)
        .get(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Óculos de Sol");
    });

    it("should return 404 for non-existent product", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/products/${nonExistentId}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should update a product", async () => {
      const product = await Product.create({
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      });

      const updateData = {
        price: 349.99,
        stock: 15,
      };

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(updateData.price);
      expect(res.body.stock).toBe(updateData.stock);
    });

    it("should not update product without authorization", async () => {
      const product = await Product.create({
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ price: 349.99 });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("should delete a product", async () => {
      const product = await Product.create({
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      });

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });

    it("should not delete product without authorization", async () => {
      const product = await Product.create({
        name: "Óculos de Sol",
        description: "Óculos estiloso",
        price: 299.99,
        stock: 10,
        category: "solar",
      });

      const res = await request(app).delete(`/api/products/${product._id}`);

      expect(res.status).toBe(401);
    });
  });
});
