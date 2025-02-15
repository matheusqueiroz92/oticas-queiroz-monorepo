import request from "supertest";
import app from "../app";
import { Order } from "../schemas/OrderSchema";
import { User } from "../schemas/UserSchema";
import { Product } from "../schemas/ProductSchema";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("Order API", () => {
  let adminToken: string;
  let employeeToken: string;
  let clientId: string;
  let productId: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let client: any;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let product: any;

  beforeEach(async () => {
    // Limpar o banco
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Criar admin e gerar token
    const admin = await User.create({
      name: "Admin Test",
      email: "admin.order@test.com",
      password: await bcrypt.hash("123456", 10),
      role: "admin",
    });
    adminToken = generateToken(admin._id.toString(), "admin");

    // Criar employee e gerar token
    const employee = await User.create({
      name: "Employee Test",
      email: "employee.order@test.com",
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });
    employeeToken = generateToken(employee._id.toString(), "employee");

    // Criar cliente e salvar ID
    client = await User.create({
      name: "Client Test",
      email: "client.order@test.com",
      password: await bcrypt.hash("123456", 10),
      role: "customer",
    });
    clientId = client._id.toString();

    // Criar produto e salvar ID
    product = await Product.create({
      name: "Óculos de Grau",
      description: "Óculos para miopia",
      price: 250,
      stock: 10,
      category: "grau",
    });
    productId = product._id.toString();

    // Verificar se as criações foram bem sucedidas
    console.log("Cliente criado:", client);
    console.log("Produto criado:", product);
  });

  it("should create a new order", async () => {
    // Criar cliente e produto especificamente para este teste
    const testClient = await User.create({
      name: "Test Client",
      email: "test.client@example.com",
      password: await bcrypt.hash("123456", 10),
      role: "customer",
    });

    const testProduct = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 250,
      stock: 10,
      category: "grau",
    });

    // Criar ordem usando as referências recém-criadas
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        clientId: testClient._id.toString(),
        products: [testProduct._id.toString()],
        totalPrice: 250,
      });

    console.log("Ordem enviada:", {
      clientId: testClient._id.toString(),
      products: [testProduct._id.toString()],
      totalPrice: 250,
    });

    expect(res.statusCode).toEqual(201);
  });

  it("should get an order by ID", async () => {
    // Criar cliente e produto específicos para este teste
    const testClient = await User.create({
      name: "Test Client",
      email: `test.client.${Date.now()}@example.com`,
      password: await bcrypt.hash("123456", 10),
      role: "customer",
    });

    const testProduct = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 250,
      stock: 10,
      category: "grau",
    });

    // Criar a ordem
    const orderData = {
      clientId: testClient._id,
      products: [testProduct._id],
      totalPrice: 250,
      status: "pending",
    };

    const createdOrder = await Order.create(orderData);

    // Verificar se os dados persistiram
    const verifyClient = await User.findById(testClient._id);
    const verifyProduct = await Product.findById(testProduct._id);

    console.log("Verificação do Cliente:", verifyClient);
    console.log("Verificação do Produto:", verifyProduct);

    // Fazer a requisição
    const res = await request(app)
      .get(`/api/orders/${createdOrder._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    console.log("Resposta completa:", res.body);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("clientId");
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
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "in_production" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "in_production");
  });
});
