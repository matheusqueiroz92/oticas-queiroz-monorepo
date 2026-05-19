import { describe, it, expect } from "@jest/globals";
import {
  getOrderListTotalPrice,
  getOrderPaidFromEmbeddedPayments,
  getOrderRemainingDebt,
  orderHasEmbeddedDebt,
} from "../../../utils/orderDebtMath";
import type { IOrder } from "../../../interfaces/IOrder";

describe("orderDebtMath", () => {
  const base: IOrder = {
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
    paymentEntry: 30,
    paymentHistory: [{ paymentId: "p1", amount: 20, date: new Date(), method: "pix" }],
  };

  it("getOrderListTotalPrice uses finalPrice when set", () => {
    expect(getOrderListTotalPrice({ ...base, finalPrice: 90, totalPrice: 100 })).toBe(90);
  });

  it("getOrderListTotalPrice falls back to totalPrice", () => {
    const o = { ...base } as IOrder;
    delete (o as Partial<IOrder>).finalPrice;
    expect(getOrderListTotalPrice(o)).toBe(100);
  });

  it("getOrderPaidFromEmbeddedPayments sums entry and history", () => {
    expect(getOrderPaidFromEmbeddedPayments(base)).toBe(50);
  });

  it("getOrderPaidFromEmbeddedPayments treats missing paymentHistory as empty", () => {
    const o = { ...base };
    delete (o as Partial<IOrder>).paymentHistory;
    expect(getOrderPaidFromEmbeddedPayments(o)).toBe(30);
  });

  it("getOrderPaidFromEmbeddedPayments treats missing paymentEntry as zero", () => {
    const o = { ...base, paymentHistory: [] };
    delete (o as Partial<IOrder>).paymentEntry;
    expect(getOrderPaidFromEmbeddedPayments(o)).toBe(0);
  });

  it("getOrderRemainingDebt is non-negative", () => {
    expect(getOrderRemainingDebt(base)).toBe(50);
    expect(
      getOrderRemainingDebt({
        ...base,
        paymentEntry: 150,
        paymentHistory: [],
      })
    ).toBe(0);
  });

  it("orderHasEmbeddedDebt ignores cancelled orders", () => {
    expect(
      orderHasEmbeddedDebt({
        ...base,
        status: "cancelled",
        paymentEntry: 0,
        paymentHistory: [],
      })
    ).toBe(false);
  });

  it("orderHasEmbeddedDebt detects open balance", () => {
    expect(orderHasEmbeddedDebt(base)).toBe(true);
  });

  it("orderHasEmbeddedDebt false when fully paid", () => {
    expect(
      orderHasEmbeddedDebt({
        ...base,
        paymentEntry: 100,
        paymentHistory: [],
      })
    ).toBe(false);
  });
});
