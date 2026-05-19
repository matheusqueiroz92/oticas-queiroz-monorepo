import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetBotOrderByOsUseCase } from "../../../useCases/bot/GetBotOrderByOsUseCase";
import type { OrderService } from "../../../services/OrderService";
import { NotFoundError, ValidationError } from "../../../utils/AppError";
import type { IOrder } from "../../../interfaces/IOrder";

describe("GetBotOrderByOsUseCase", () => {
  let useCase: GetBotOrderByOsUseCase;
  let mockOrderSvc: jest.Mocked<Pick<OrderService, "getOrdersByServiceOrder">>;

  const order = (id: string, so: string, updated: Date): IOrder => ({
    _id: id,
    clientId: "c1",
    employeeId: "e1",
    products: [],
    serviceOrder: so,
    paymentMethod: "cash",
    paymentStatus: "pending",
    status: "pending",
    orderDate: new Date(),
    totalPrice: 100,
    discount: 0,
    finalPrice: 100,
    paymentEntry: 0,
    createdAt: new Date(),
    updatedAt: updated,
  });

  beforeEach(() => {
    mockOrderSvc = { getOrdersByServiceOrder: jest.fn() };
    useCase = new GetBotOrderByOsUseCase(
      mockOrderSvc as unknown as OrderService
    );
  });

  it("throws ValidationError when O.S. empty after normalize", async () => {
    await expect(useCase.execute("  ")).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute("abc")).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when O.S. too long", async () => {
    await expect(useCase.execute("1".repeat(21))).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("throws NotFoundError when no orders", async () => {
    mockOrderSvc.getOrdersByServiceOrder.mockResolvedValue([]);
    await expect(useCase.execute("300001")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("normalizes O.S. stripping non-digits", async () => {
    mockOrderSvc.getOrdersByServiceOrder.mockResolvedValue([order("a", "300001", new Date())]);
    const r = await useCase.execute("OS 300-001");
    expect(mockOrderSvc.getOrdersByServiceOrder).toHaveBeenCalledWith("300001");
    expect(r.serviceOrder).toBe("300001");
  });

  it("picks latest when multiple orders share serviceOrder", async () => {
    const oldO = { ...order("old", "1", new Date("2024-01-01")), finalPrice: 100 };
    const newO = { ...order("new", "1", new Date("2025-06-01")), finalPrice: 200 };
    mockOrderSvc.getOrdersByServiceOrder.mockResolvedValue([oldO, newO]);
    const r = await useCase.execute("1");
    expect(r.totalPrice).toBe(200);
  });
});
