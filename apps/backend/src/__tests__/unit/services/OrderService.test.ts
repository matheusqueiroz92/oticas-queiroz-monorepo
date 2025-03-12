import { OrderService, OrderError } from "../../../services/OrderService";
import { OrderModel } from "../../../models/OrderModel";
import { UserModel } from "../../../models/UserModel";
import { ProductModel } from "../../../models/ProductModel";
import { Types } from "mongoose";
import type { IOrder } from "../../../interfaces/IOrder";
import type { IUser } from "../../../interfaces/IUser";
import type { IProduct } from "../../../interfaces/IProduct";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  // afterAll,
  jest,
} from "@jest/globals";

interface OrderServiceWithModels {
  orderModel: jest.Mocked<OrderModel>;
  userModel: jest.Mocked<UserModel>;
  productModel: jest.Mocked<ProductModel>;
}

interface MockUser extends Omit<IUser, "comparePassword"> {
  role: "admin" | "employee" | "customer";
}

interface MockProduct extends Omit<IProduct, "_id"> {
  stock: number;
  name: string;
}

type ValidOrderStatus = "pending" | "in_production" | "ready" | "delivered";

interface MockOrderResponse extends Omit<IOrder, "status"> {
  status: ValidOrderStatus;
}

jest.mock("../../../models/OrderModel");
jest.mock("../../../models/UserModel");
jest.mock("../../../models/ProductModel");

describe("OrderService", () => {
  let orderService: OrderService;
  let orderModel: jest.Mocked<OrderModel>;
  let userModel: jest.Mocked<UserModel>;
  let productModel: jest.Mocked<ProductModel>;

  beforeEach(() => {
    orderModel = new OrderModel() as jest.Mocked<OrderModel>;
    userModel = new UserModel() as jest.Mocked<UserModel>;
    productModel = new ProductModel() as jest.Mocked<ProductModel>;

    orderService = new OrderService();
    (orderService as unknown as OrderServiceWithModels).orderModel = orderModel;
    (orderService as unknown as OrderServiceWithModels).userModel = userModel;
    (orderService as unknown as OrderServiceWithModels).productModel =
      productModel;
  });

  const mockClientId = new Types.ObjectId().toString();
  const mockEmployeeId = new Types.ObjectId().toString();
  const mockProductId = new Types.ObjectId().toString();

  const mockOrder: Omit<IOrder, "_id"> = {
    clientId: mockClientId,
    employeeId: mockEmployeeId,
    products: [mockProductId],
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

  const mockOrderWithId: IOrder = {
    _id: new Types.ObjectId().toString(),
    ...mockOrder,
  };

  describe("createOrder", () => {
    it("should create an order successfully", async () => {
      const mockCustomer: MockUser = {
        _id: mockClientId,
        name: "Test Customer",
        email: "customer@test.com",
        password: "hashed_password",
        role: "customer",
      };

      const mockEmployee: MockUser = {
        _id: mockEmployeeId,
        name: "Test Employee",
        email: "employee@test.com",
        password: "hashed_password",
        role: "employee",
      };

      userModel.findById.mockImplementation((id: string) => {
        if (id === mockClientId) {
          return Promise.resolve(mockCustomer as IUser);
        }
        if (id === mockEmployeeId) {
          return Promise.resolve(mockEmployee as IUser);
        }
        return Promise.resolve(null);
      });

      const mockProductData: MockProduct = {
        name: "Test Product",
        category: "solar",
        description: "Test Description",
        brand: "Test Brand",
        modelGlasses: "Test Model",
        price: 100,
        stock: 10,
      };

      productModel.findById.mockResolvedValue({
        ...mockProductData,
        _id: mockProductId,
      } as IProduct);
      orderModel.create.mockResolvedValue(mockOrderWithId);

      const result = await orderService.createOrder(mockOrder);

      expect(result).toEqual(mockOrderWithId);
      expect(productModel.updateStock).toHaveBeenCalledWith(mockProductId, -1);
    });

    it("should throw error if client not found", async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(orderService.createOrder(mockOrder)).rejects.toThrow(
        new OrderError("Cliente não encontrado")
      );
    });

    it("should throw error if client is not a customer", async () => {
      const mockEmployee: MockUser = {
        _id: mockClientId,
        name: "Test Employee",
        email: "employee@test.com",
        password: "hashed_password",
        role: "employee",
      };

      userModel.findById.mockResolvedValue(mockEmployee as IUser);

      await expect(orderService.createOrder(mockOrder)).rejects.toThrow(
        new OrderError("ID fornecido não pertence a um cliente")
      );
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status successfully", async () => {
      const mockOrderPending: MockOrderResponse = {
        ...mockOrderWithId,
        status: "pending",
      };

      const mockOrderInProduction: MockOrderResponse = {
        ...mockOrderWithId,
        status: "in_production",
      };

      orderModel.findById.mockResolvedValue(mockOrderPending);
      orderModel.updateStatus.mockResolvedValue(mockOrderInProduction);

      const result = await orderService.updateOrderStatus(
        mockOrderWithId._id,
        "in_production",
        mockEmployeeId,
        "employee"
      );

      expect(result.status).toBe("in_production");
    });

    it("should throw error for invalid status transition", async () => {
      const mockOrderPending: MockOrderResponse = {
        ...mockOrderWithId,
        status: "pending",
      };

      orderModel.findById.mockResolvedValue(mockOrderPending);

      await expect(
        orderService.updateOrderStatus(
          mockOrderWithId._id,
          "delivered",
          mockEmployeeId,
          "employee"
        )
      ).rejects.toThrow(
        new OrderError(
          "Não é possível alterar o status de pending para delivered"
        )
      );
    });
  });

  describe("getOrdersByClientId", () => {
    it("should return client orders", async () => {
      orderModel.findByClientId.mockResolvedValue([mockOrderWithId]);

      const result = await orderService.getOrdersByClientId(mockClientId);

      expect(result).toEqual([mockOrderWithId]);
      expect(orderModel.findByClientId).toHaveBeenCalledWith(
        mockClientId,
        true
      );
    });

    it("should throw error if no orders found", async () => {
      orderModel.findByClientId.mockResolvedValue([]);

      await expect(
        orderService.getOrdersByClientId(mockClientId)
      ).rejects.toThrow(
        new OrderError("Nenhum pedido encontrado para este cliente")
      );
    });
  });
});
