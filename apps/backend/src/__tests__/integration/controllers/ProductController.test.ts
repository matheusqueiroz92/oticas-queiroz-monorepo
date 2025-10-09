import request from "supertest";
import app from "../../../app";
import { Product } from "../../../schemas/ProductSchema";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import mongoose from "mongoose";
import type { CreateProductDTO } from "../../../interfaces/IProduct";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  afterAll,
  // jest,
} from "@jest/globals";

config();

describe("ProductController", () => {
  let adminToken: string;
  let employeeToken: string;

  const mockProduct: CreateProductDTO<"sunglasses_frame"> = {
    name: "Óculos de Sol Ray-Ban",
    productType: "sunglasses_frame",
    description: "Óculos de sol estiloso",
    image: "src/public/images/ray-ban-aviator.png",
    brand: "Ray-Ban",
    modelSunglasses: "Aviador",
    sellPrice: 599.99,
    typeFrame: "aviador",
    color: "dourado",
    shape: "redondo",
    reference: "RB3025",
    stock: 10,
  };

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});

    // Criar admin e gerar token
    const admin = await User.create({
      name: "Admin Test",
      email: `admin.${Date.now()}@test.com`,
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
        .send({ ...mockProduct, sellPrice: -10 });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/products", () => {
    it("should get all products with pagination", async () => {
      // Criar um produto primeiro
      await Product.create(mockProduct);

      const res = await request(app)
        .get("/api/products")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
    });

    it("should filter products by category", async () => {
      // Criar produtos para teste
      await Product.create(mockProduct);
      await Product.create({
        ...mockProduct,
        productType: "prescription_frame",
        name: "Óculos de Grau",
        typeFrame: "grau",
        color: "preto",
        shape: "quadrado",
        reference: "PG001",
      });

      const res = await request(app)
        .get("/api/products?productType=sunglasses_frame")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].productType).toBe("sunglasses_frame");
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
      const updateData = { sellPrice: 699.99 };

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.sellPrice).toBe(updateData.sellPrice);
    });

    it("should not update with invalid data", async () => {
      const product = await Product.create(mockProduct);

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ sellPrice: -10 });

      expect(res.status).toBe(400);
    });

    it("should create sunglasses frame with correct type", async () => {
      const sunglassesData: CreateProductDTO<"sunglasses_frame"> = {
        name: "Óculos de Sol Oakley",
        productType: "sunglasses_frame",
        description: "Óculos esportivo",
        brand: "Oakley",
        modelSunglasses: "Holbrook",
        sellPrice: 799.99,
        typeFrame: "esportivo",
        color: "preto",
        shape: "quadrado",
        reference: "OO9102",
        stock: 5,
      };

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sunglassesData);

      expect(res.status).toBe(201);
      expect(res.body.productType).toBe("sunglasses_frame");
      expect(res.body.modelSunglasses).toBe("Holbrook");
    });

    it("should create prescription frame with correct type", async () => {
      const prescriptionData: CreateProductDTO<"prescription_frame"> = {
        name: "Óculos de Grau Classic",
        productType: "prescription_frame",
        description: "Armação clássica",
        brand: "Classic Brand",
        sellPrice: 499.99,
        typeFrame: "metal",
        color: "prata",
        shape: "redondo",
        reference: "CL001",
        stock: 8,
      };

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(prescriptionData);

      expect(res.status).toBe(201);
      expect(res.body.productType).toBe("prescription_frame");
      expect(res.body).not.toHaveProperty("modelSunglasses");
    });

    it("should not change productType when updating sunglasses frame", async () => {
      // Criar armação de sol
      const sunglassesData: CreateProductDTO<"sunglasses_frame"> = {
        name: "Óculos de Sol Aviador",
        productType: "sunglasses_frame",
        brand: "Test Brand",
        modelSunglasses: "Aviador",
        sellPrice: 599.99,
        typeFrame: "aviador",
        color: "dourado",
        shape: "aviador",
        reference: "AV001",
        stock: 10,
      };

      const createRes = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sunglassesData);

      expect(createRes.status).toBe(201);
      expect(createRes.body.productType).toBe("sunglasses_frame");

      const productId = createRes.body._id;

      // Tentar atualizar o produto
      const updateRes = await request(app)
        .put(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ sellPrice: 799.99, color: "preto" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.productType).toBe("sunglasses_frame");
      expect(updateRes.body.sellPrice).toBe(799.99);
      expect(updateRes.body.color).toBe("preto");
    });

    it("should not change productType when updating prescription frame", async () => {
      // Criar armação de grau
      const prescriptionData: CreateProductDTO<"prescription_frame"> = {
        name: "Óculos de Grau Moderno",
        productType: "prescription_frame",
        brand: "Modern Brand",
        sellPrice: 399.99,
        typeFrame: "acetato",
        color: "preto",
        shape: "retangular",
        reference: "MD001",
        stock: 15,
      };

      const createRes = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(prescriptionData);

      expect(createRes.status).toBe(201);
      expect(createRes.body.productType).toBe("prescription_frame");

      const productId = createRes.body._id;

      // Tentar atualizar o produto
      const updateRes = await request(app)
        .put(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ sellPrice: 449.99, stock: 20 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.productType).toBe("prescription_frame");
      expect(updateRes.body.sellPrice).toBe(449.99);
      expect(updateRes.body.stock).toBe(20);
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
