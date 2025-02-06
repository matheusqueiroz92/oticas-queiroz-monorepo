import request from "supertest";
import app from "../app";
import { Product } from "../models/Product";
import { describe, it, expect, afterEach } from "@jest/globals";

describe("Product API", () => {
  afterEach(async () => {
    await Product.deleteMany({});
  });

  it("should create a new product", async () => {
    const res = await request(app).post("/api/products").send({
      name: "Óculos de Grau",
      description: "Óculos para miopia",
      price: 250,
      stock: 10,
      category: "grau",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("name", "Óculos de Grau");
    expect(res.body).toHaveProperty("price", 250);
  });

  it("should get a product by ID", async () => {
    const product = await Product.create({
      name: "Óculos de Sol",
      description: "Óculos escuros",
      price: 150,
      stock: 5,
      category: "solar",
    });

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "Óculos de Sol");
    expect(res.body).toHaveProperty("category", "solar");
  });
});
