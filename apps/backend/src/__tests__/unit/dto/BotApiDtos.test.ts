import { describe, it, expect } from "@jest/globals";
import type { IOrder } from "../../../interfaces/IOrder";
import {
  mapOrderToBotSummary,
  pickLatestOrder,
  mapClientDebtsToBotDto,
} from "../../../dto/bot/BotApiDtos";
import type { ClientDebtsData } from "../../../services/ClientDebtQueryService";

describe("BotApiDtos", () => {
  const orderBase: IOrder = {
    _id: "o1",
    clientId: "c1",
    employeeId: "e1",
    products: [],
    serviceOrder: "300001",
    paymentMethod: "cash",
    paymentStatus: "partially_paid",
    status: "in_production",
    orderDate: new Date("2025-01-10T12:00:00.000Z"),
    totalPrice: 200,
    discount: 0,
    finalPrice: 200,
    paymentEntry: 50,
    paymentHistory: [],
  };

  it("mapOrderToBotSummary maps fields and null deliveryDate", () => {
    const r = mapOrderToBotSummary({ ...orderBase, serviceOrder: undefined });
    expect(r.serviceOrder).toBe("");
    expect(r.status).toBe("in_production");
    expect(r.paymentStatus).toBe("partially_paid");
    expect(r.remainingAmount).toBe(150);
    expect(r.deliveryDate).toBeNull();
  });

  it("mapOrderToBotSummary includes deliveryDate when set", () => {
    const d = new Date("2025-02-01T00:00:00.000Z");
    const r = mapOrderToBotSummary({ ...orderBase, deliveryDate: d });
    expect(r.deliveryDate).toBe(d.toISOString());
  });

  it("mapOrderToBotSummary normalizes string orderDate and deliveryDate", () => {
    const r = mapOrderToBotSummary({
      ...orderBase,
      orderDate: "2024-06-01T00:00:00.000Z" as unknown as Date,
      deliveryDate: "2024-07-01T00:00:00.000Z" as unknown as Date,
    });
    expect(r.orderDate).toBe("2024-06-01T00:00:00.000Z");
    expect(r.deliveryDate).toBe("2024-07-01T00:00:00.000Z");
  });

  it("pickLatestOrder sorts by updatedAt then createdAt", () => {
    const a: IOrder = {
      ...orderBase,
      _id: "a",
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    };
    const b: IOrder = {
      ...orderBase,
      _id: "b",
      updatedAt: new Date("2025-03-01T00:00:00.000Z"),
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    };
    expect(pickLatestOrder([a, b])._id).toBe("b");
  });

  it("pickLatestOrder falls back when updatedAt missing", () => {
    const older: IOrder = {
      ...orderBase,
      _id: "old",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const newer: IOrder = {
      ...orderBase,
      _id: "new",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    };
    delete (older as Partial<IOrder>).updatedAt;
    delete (newer as Partial<IOrder>).updatedAt;
    expect(pickLatestOrder([older, newer])._id).toBe("new");
  });

  it("pickLatestOrder uses zero when no timestamps", () => {
    const x: IOrder = { ...orderBase, _id: "x" };
    const y: IOrder = { ...orderBase, _id: "y" };
    delete (x as Partial<IOrder>).updatedAt;
    delete (x as Partial<IOrder>).createdAt;
    delete (y as Partial<IOrder>).updatedAt;
    delete (y as Partial<IOrder>).createdAt;
    expect(pickLatestOrder([x, y])._id).toBeTruthy();
  });

  it("mapClientDebtsToBotDto builds pendingDebts", () => {
    const data: ClientDebtsData = {
      totalDebt: 75,
      paymentHistory: [],
      orders: [
        {
          _id: "x1",
          serviceOrder: "1",
          createdAt: new Date(),
          status: "delivered",
          finalPrice: 100,
          paymentEntry: 25,
        },
      ],
    };
    const r = mapClientDebtsToBotDto("12345678901", data);
    expect(r.cpf).toBe("12345678901");
    expect(r.totalDebt).toBe(75);
    expect(r.pendingDebts).toHaveLength(1);
    expect(r.pendingDebts[0].remainingAmount).toBe(75);
    expect(r.pendingDebts[0].orderId).toBe("x1");
  });

  it("mapClientDebtsToBotDto uses empty orderId when _id missing", () => {
    const data: ClientDebtsData = {
      totalDebt: 0,
      paymentHistory: [],
      orders: [
        {
          _id: undefined,
          serviceOrder: undefined,
          createdAt: new Date(),
          status: "pending",
          finalPrice: 10,
          paymentEntry: 10,
        },
      ],
    };
    const r = mapClientDebtsToBotDto("12345678901", data);
    expect(r.pendingDebts[0].orderId).toBe("");
    expect(r.pendingDebts[0].serviceOrder).toBeNull();
  });
});
