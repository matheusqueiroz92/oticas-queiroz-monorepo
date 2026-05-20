import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ClientDebtQueryService } from "../../../services/ClientDebtQueryService";
import type { OrderService } from "../../../services/OrderService";
import type { PaymentService } from "../../../services/PaymentService";
import type { UserService } from "../../../services/UserService";
import { NotFoundError } from "../../../utils/AppError";
import type { IOrder } from "../../../interfaces/IOrder";

describe("ClientDebtQueryService", () => {
  let service: ClientDebtQueryService;
  let mockOrderSvc: jest.Mocked<
    Pick<OrderService, "getOrdersByClientId">
  >;
  let mockPaySvc: jest.Mocked<Pick<PaymentService, "getAllPayments">>;
  let mockUserSvc: jest.Mocked<Pick<UserService, "getUserById">>;

  beforeEach(() => {
    mockOrderSvc = { getOrdersByClientId: jest.fn() };
    mockPaySvc = { getAllPayments: jest.fn() };
    mockUserSvc = { getUserById: jest.fn() };
    service = new ClientDebtQueryService(
      mockOrderSvc as unknown as OrderService,
      mockPaySvc as unknown as PaymentService,
      mockUserSvc as unknown as UserService
    );
  });

  const minimalOrder = (over: Partial<IOrder> = {}): IOrder => ({
    _id: "ord1",
    clientId: "c1",
    employeeId: "e1",
    products: [],
    paymentMethod: "cash",
    paymentStatus: "pending",
    status: "pending",
    orderDate: new Date(),
    totalPrice: 100,
    discount: 0,
    finalPrice: 100,
    paymentEntry: 0,
    serviceOrder: "SO1",
    ...over,
  });

  it("throws NotFoundError when getUserById fails", async () => {
    mockUserSvc.getUserById.mockRejectedValue(
      new NotFoundError("Usuário não encontrado")
    );
    await expect(service.getClientDebtsData("u1")).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(mockOrderSvc.getOrdersByClientId).not.toHaveBeenCalled();
  });

  it("excludes cancelled and fully paid orders; sums remaining debt", async () => {
    mockUserSvc.getUserById.mockResolvedValue({ _id: "u1" } as never);
    mockOrderSvc.getOrdersByClientId.mockResolvedValue([
      minimalOrder({ status: "cancelled", paymentEntry: 0 }),
      minimalOrder({ _id: "a", paymentEntry: 100, status: "delivered" }),
      minimalOrder({
        _id: "b",
        finalPrice: 200,
        totalPrice: 200,
        paymentEntry: 50,
        paymentHistory: [{ paymentId: "p", amount: 30, date: new Date(), method: "pix" }],
        status: "ready",
        serviceOrder: "SO2",
      }),
    ]);
    mockPaySvc.getAllPayments.mockResolvedValue({
      payments: [{ _id: "pay1" } as never],
    } as never);

    const r = await service.getClientDebtsData("u1");

    expect(r.totalDebt).toBe(120);
    expect(r.orders).toHaveLength(1);
    expect(r.orders[0].serviceOrder).toBe("SO2");
    expect(r.orders[0].paymentEntry).toBe(80);
    expect(r.paymentHistory).toEqual([{ _id: "pay1" }]);
    expect(mockPaySvc.getAllPayments).toHaveBeenCalledWith(1, 10_000, {
      customerId: "u1",
    });
  });

  it("normalizes undefined payments list from getAllPayments", async () => {
    mockUserSvc.getUserById.mockResolvedValue({ _id: "u1" } as never);
    mockOrderSvc.getOrdersByClientId.mockResolvedValue([]);
    mockPaySvc.getAllPayments.mockResolvedValue({
      payments: undefined,
    } as never);

    const r = await service.getClientDebtsData("u1");
    expect(r.paymentHistory).toEqual([]);
  });

  it("uses empty payment list when API returns none", async () => {
    mockUserSvc.getUserById.mockResolvedValue({ _id: "u1" } as never);
    mockOrderSvc.getOrdersByClientId.mockResolvedValue([]);
    mockPaySvc.getAllPayments.mockResolvedValue({} as never);

    const r = await service.getClientDebtsData("u1");
    expect(r.totalDebt).toBe(0);
    expect(r.orders).toHaveLength(0);
    expect(r.paymentHistory).toEqual([]);
  });
});
