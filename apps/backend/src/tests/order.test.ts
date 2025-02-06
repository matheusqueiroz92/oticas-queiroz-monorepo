import request from "supertest";
import app from "../app";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("Order API", () => {
  let clientId: string;
  let productId: string;

  beforeEach(async () => {
    // Limpar dados
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Criar dados de teste
    const client = await User.create({
      name: "Test",
      email: `test${Date.now()}@example.com`,
      password: "123456",
      role: "customer",
    });

    const product = await Product.create({
      name: "Óculos de Grau",
      description: "Óculos para miopia",
      price: 250,
      stock: 10,
      category: "grau",
    });
    clientId = client._id.toString();
    productId = product._id.toString();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
  });

  it("should create a new order", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ clientId, products: [productId], totalPrice: 250 });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("clientId", clientId);
    expect(res.body).toHaveProperty("totalPrice", 250);
  }, 10000);

  it("should get an order by ID", async () => {
    const order = await Order.create({
      clientId,
      products: [productId],
      totalPrice: 250,
    });

    // console.log("Order created:", order);
    const savedOrder = await Order.findById(order._id);
    console.log("Order found in DB:", savedOrder);

    const res = await request(app).get(`/api/orders/${order._id}`);
    console.log("Response:", res.body);

    expect(res.statusCode).toEqual(200);
    expect(res.body.clientId._id.toString()).toBe(clientId);
    expect(res.body.totalPrice).toBe(250);
  });

  it("should update the status of an order", async () => {
    const order = await Order.create({
      clientId,
      products: [productId],
      totalPrice: 250,
    });

    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .send({ status: "in_production" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "in_production");
  });
});
