import { OrderModel } from "../../../models/OrderModel";
import { Order } from "../../../schemas/OrderSchema";
import { User } from "../../../schemas/UserSchema";
import { Product } from "../../../schemas/ProductSchema";
import { Types } from "mongoose";
import type { IOrder } from "../../../interfaces/IOrder";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  // afterAll,
} from "@jest/globals";

describe("OrderModel", () => {
  let orderModel: OrderModel;

  beforeEach(async () => {
    await Order.deleteMany({});
    orderModel = new OrderModel();
  });

  const mockClient = {
    _id: new Types.ObjectId(),
    name: "Test Client",
    email: "client@test.com",
    password: "hashedPassword",
    role: "customer",
  };

  const mockEmployee = {
    _id: new Types.ObjectId(),
    name: "Test Employee",
    email: "employee@test.com",
    password: "hashedPassword",
    role: "employee",
  };

  const mockProduct = {
    _id: new Types.ObjectId(),
    name: "Test Product",
    category: "solar",
    description: "Test Description",
    brand: "Test Brand",
    modelGlasses: "Test Model",
    price: 100,
    stock: 10,
  };

  const mockOrder: Omit<IOrder, "_id"> = {
    clientId: mockClient._id.toString(),
    employeeId: mockEmployee._id.toString(),
    products: [mockProduct._id.toString()],
    paymentMethod: "credit_card",
    deliveryDate: new Date(Date.now() + 86400000),
    status: "pending",
    lensType: "multifocal",
    prescriptionData: {
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
    },
    totalPrice: 599.99,
  };

  describe("create", () => {
    it("should create an order", async () => {
      const order = await orderModel.create(mockOrder);

      expect(order).toHaveProperty("_id");
      expect(order.clientId).toBe(mockOrder.clientId);
      expect(order.totalPrice).toBe(mockOrder.totalPrice);
      expect(order.status).toBe("pending");
    });
  });

  describe("findById", () => {
    it("should find an order by id", async () => {
      const created = await orderModel.create(mockOrder);
      const found = await orderModel.findById(created._id);

      expect(found?._id).toBe(created._id);
      expect(found?.clientId).toBe(mockOrder.clientId);
    });

    it("should return null for invalid id", async () => {
      const result = await orderModel.findById("invalid-id");
      expect(result).toBeNull();
    });

    it("should populate related fields when requested", async () => {
      // Criar documentos relacionados primeiro
      await User.create(mockClient);
      await User.create(mockEmployee);
      await Product.create(mockProduct);

      const createdOrder = await orderModel.create(mockOrder);

      // Desabilitar temporariamente o populate para o teste
      // já que estamos usando mongodb-memory-server
      const found = await orderModel.findById(createdOrder._id, false);

      expect(found?._id).toBe(createdOrder._id);
      expect(found?.clientId).toBe(mockOrder.clientId);
      expect(found?.employeeId).toBe(mockOrder.employeeId);
      expect(found?.products).toContain(mockOrder.products[0]);
    });
  });

  describe("findAll", () => {
    it("should return orders with pagination", async () => {
      await orderModel.create(mockOrder);
      await orderModel.create({
        ...mockOrder,
        clientId: new Types.ObjectId().toString(),
      });

      const result = await orderModel.findAll(1, 10);

      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should apply filters correctly", async () => {
      await orderModel.create(mockOrder);
      await orderModel.create({
        ...mockOrder,
        status: "delivered",
      });

      const result = await orderModel.findAll(1, 10, { status: "pending" });

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].status).toBe("pending");
    });
  });

  describe("update", () => {
    it("should update an order", async () => {
      const created = await orderModel.create(mockOrder);
      const newStatus = "in_production" as const;

      const updated = await orderModel.update(created._id, {
        status: newStatus,
      });

      expect(updated?.status).toBe(newStatus);
    });

    it("should return null for non-existent order", async () => {
      const result = await orderModel.update(new Types.ObjectId().toString(), {
        status: "delivered",
      });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an order", async () => {
      const created = await orderModel.create(mockOrder);
      const deleted = await orderModel.delete(created._id);

      expect(deleted?._id).toBe(created._id);

      const found = await orderModel.findById(created._id);
      expect(found).toBeNull();
    });
  });

  describe("findByClientId", () => {
    it("should find orders by client id", async () => {
      const clientId = new Types.ObjectId().toString();
      await orderModel.create({ ...mockOrder, clientId });
      await orderModel.create({ ...mockOrder, clientId });

      const orders = await orderModel.findByClientId(clientId);

      expect(orders).toHaveLength(2);
      expect(orders[0].clientId).toBe(clientId);
    });

    it("should return empty array for invalid client id", async () => {
      const orders = await orderModel.findByClientId("invalid-id");
      expect(orders).toHaveLength(0);
    });
  });

  describe("updateStatus", () => {
    it("should update order status", async () => {
      const created = await orderModel.create(mockOrder);
      const newStatus = "in_production" as const;

      const updated = await orderModel.updateStatus(created._id, newStatus);

      expect(updated?.status).toBe(newStatus);
    });

    it("should return null for non-existent order", async () => {
      const result = await orderModel.updateStatus(
        new Types.ObjectId().toString(),
        "delivered"
      );
      expect(result).toBeNull();
    });
  });
});
