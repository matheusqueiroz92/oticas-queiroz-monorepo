import request from "supertest";
import app from "../../../app";
import { Order } from "../../../schemas/OrderSchema";
import { User } from "../../../schemas/UserSchema";
import { Product } from "../../../schemas/ProductSchema";
import { Laboratory } from "../../../schemas/LaboratorySchema";
import { generateToken } from "../../../utils/jwt";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  // afterAll,
  // jest,
} from "@jest/globals";

describe("OrderController", () => {
  let adminToken: string;
  let employeeToken: string;
  let customerToken: string;
  let clientId: string;
  let employeeId: string;
  let productId: string;
  let laboratoryId: string;

  const mockPrescriptionData = {
    doctorName: "Dr. Smith",
    clinicName: "Eye Clinic",
    appointmentdate: new Date(),
    leftEye: {
      near: { sph: -2.5, cyl: -0.5, axis: 180, pd: 32 },
      far: { sph: -2.0, cyl: -0.5, axis: 180, pd: 32 },
    },
    rightEye: {
      near: { sph: -2.0, cyl: -0.5, axis: 175, pd: 32 },
      far: { sph: -1.5, cyl: -0.5, axis: 175, pd: 32 },
    },
  };

  beforeEach(async () => {
    await Order.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Laboratory.deleteMany({});

    // Criar usuários
    const admin = await User.create({
      name: "Admin Test",
      email: `admin.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "admin",
    });
    adminToken = generateToken(admin._id.toString(), "admin");

    const employee = await User.create({
      name: "Employee Test",
      email: `employee.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });
    employeeToken = generateToken(employee._id.toString(), "employee");
    employeeId = employee._id.toString();

    const customer = await User.create({
      name: "Customer Test",
      email: `customer.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "customer",
    });
    customerToken = generateToken(customer._id.toString(), "customer");
    clientId = customer._id.toString();

    // Criar produto
    const product = await Product.create({
      name: "Test Product",
      category: "solar",
      description: "Test Description",
      brand: "Test Brand",
      modelGlasses: "Test Model",
      price: 100,
      stock: 10,
    });
    productId = product._id.toString();

    // Criar laboratório
    const laboratory = await Laboratory.create({
      name: "Test Laboratory",
      address: {
        street: "Test Street",
        number: "123",
        neighborhood: "Test Neighborhood",
        city: "Test City",
        state: "ST",
        zipCode: "12345678",
      },
      phone: "11999999999",
      email: "test@laboratory.com",
      contactName: "Test Contact",
      isActive: true,
    });
    laboratoryId = laboratory._id.toString();
  });

  const mockOrder = {
    clientId: "",
    employeeId: "",
    products: [""],
    description: "Test Order",
    paymentMethod: "credit_card",
    paymentEntry: 100,
    installments: 3,
    deliveryDate: new Date(Date.now() + 86400000),
    status: "pending",
    laboratoryId: "",
    lensType: "multifocal",
    prescriptionData: mockPrescriptionData,
    totalPrice: 599.99,
  };

  describe("POST /api/orders", () => {
    it("should create an order when employee", async () => {
      const orderData = {
        ...mockOrder,
        clientId,
        employeeId,
        products: [productId],
        laboratoryId,
      };

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(orderData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.clientId).toBe(clientId);
    });

    it("should not create order without authorization", async () => {
      const res = await request(app).post("/api/orders").send(mockOrder);

      expect(res.status).toBe(401);
    });

    it("should not create order with invalid data", async () => {
      const invalidOrder = {
        ...mockOrder,
        clientId,
        employeeId,
        totalPrice: -100,
      };

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(invalidOrder);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/orders", () => {
    it("should get all orders with pagination", async () => {
      const order = await Order.create({
        ...mockOrder,
        clientId,
        employeeId,
        products: [productId],
        laboratoryId,
      });

      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it("should filter orders by status", async () => {
      await Order.create({
        ...mockOrder,
        clientId,
        employeeId,
        products: [productId],
        laboratoryId,
        status: "pending",
      });

      await Order.create({
        ...mockOrder,
        clientId,
        employeeId,
        products: [productId],
        laboratoryId,
        status: "delivered",
      });

      const res = await request(app)
        .get("/api/orders?status=pending")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders).toHaveLength(1);
      expect(res.body.orders[0].status).toBe("pending");
    });
  });

  describe("GET /api/orders/:id", () => {
    it("should get an order by id", async () => {
      const order = await Order.create({
        ...mockOrder,
        clientId,
        employeeId,
        products: [productId],
        laboratoryId,
      });

      const res = await request(app)
        .get(`/api/orders/${order._id}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(order._id.toString());
    });

    it("should return 404 for non-existent order", async () => {
      const res = await request(app)
        .get(`/api/orders/${new Types.ObjectId()}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/orders/:id/status", () => {
    it("should update order status", async () => {
      const order = await Order.create({
        ...mockOrder,
        clientId,
        employeeId,
        products: [productId],
        laboratoryId,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ status: "in_production" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("in_production");
    });

    it("should not allow invalid status transition", async () => {
      const order = await Order.create({
        ...mockOrder,
        clientId,
        employeeId,
        products: [productId],
        laboratoryId,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ status: "delivered" });

      expect(res.status).toBe(400);
    });
  });
});
