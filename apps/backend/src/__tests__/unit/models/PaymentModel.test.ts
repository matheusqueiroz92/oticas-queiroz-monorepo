import mongoose from "mongoose";
import { PaymentModel } from "../../../models/PaymentModel";
import { Payment } from "../../../schemas/PaymentSchema";
import { CashRegister } from "../../../schemas/CashRegisterSchema";
import { User } from "../../../schemas/UserSchema";
import { Types } from "mongoose";
import type { IPayment } from "../../../interfaces/IPayment";
import {
  createTestUser,
  createTestCashRegister,
} from "../../helpers/testHelpers";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("PaymentModel", () => {
  let paymentModel: PaymentModel;

  beforeEach(async () => {
    await Promise.all([
      Payment.deleteMany({}),
      CashRegister.deleteMany({}),
      User.deleteMany({}),
    ]);
    paymentModel = new PaymentModel();
  });

  describe("create", () => {
    it("should create a payment", async () => {
      const { user } = await createTestUser("employee");
      const register = await createTestCashRegister(user._id.toString());

      const paymentData: Omit<IPayment, "_id" | "createdAt" | "updatedAt"> = {
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "pending",
        cashRegisterId: register._id.toString(),
        createdBy: user._id.toString(),
      };

      const payment = await paymentModel.create(paymentData);

      expect(payment).toHaveProperty("_id");
      expect(payment.amount).toBe(100);
      expect(payment.status).toBe("pending");
      expect(payment.cashRegisterId).toBe(register._id.toString());
      expect(payment.createdBy).toBe(user._id.toString());
    });
  });

  describe("findById", () => {
    it("should find payment by id and populate related fields", async () => {
      const { user } = await createTestUser("employee");
      const register = await createTestCashRegister(user._id.toString());

      const paymentData: Omit<IPayment, "_id" | "createdAt" | "updatedAt"> = {
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "pending",
        cashRegisterId: register._id.toString(),
        createdBy: user._id.toString(),
      };

      const payment = await paymentModel.create(paymentData);

      // Garantir que payment._id existe
      if (!payment._id) {
        throw new Error("Payment not created correctly");
      }

      const found = await paymentModel.findById(payment._id, true);

      expect(found).toBeTruthy();
      expect(found?.cashRegisterId).toBe(register._id.toString());
    });

    it("should return null for invalid id", async () => {
      const result = await paymentModel.findById("invalid-id");
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return payments with pagination", async () => {
      const { user } = await createTestUser("employee");
      const register = await createTestCashRegister(user._id.toString());

      const paymentData: Omit<IPayment, "_id" | "createdAt" | "updatedAt"> = {
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "pending",
        cashRegisterId: register._id.toString(),
        createdBy: user._id.toString(),
      };

      await paymentModel.create(paymentData);
      await paymentModel.create({
        ...paymentData,
        amount: 200,
      });

      const result = await paymentModel.findAll(1, 10);

      expect(result.payments).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should apply filters correctly", async () => {
      const { user } = await createTestUser("employee");
      const register = await createTestCashRegister(user._id.toString());

      const paymentData: Omit<IPayment, "_id" | "createdAt" | "updatedAt"> = {
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "pending",
        cashRegisterId: register._id.toString(),
        createdBy: user._id.toString(),
      };

      await paymentModel.create(paymentData);
      await paymentModel.create({
        ...paymentData,
        type: "debt_payment",
      });

      const result = await paymentModel.findAll(1, 10, { type: "sale" });

      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].type).toBe("sale");
    });
  });

  describe("updateStatus", () => {
    it("should update payment status", async () => {
      const { user } = await createTestUser("employee");
      const register = await createTestCashRegister(user._id.toString());

      const paymentData: Omit<IPayment, "_id" | "createdAt" | "updatedAt"> = {
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "pending",
        cashRegisterId: register._id.toString(),
        createdBy: user._id.toString(),
      };

      const payment = await paymentModel.create(paymentData);

      // Garantir que payment._id existe
      if (!payment._id) {
        throw new Error("Payment not created correctly");
      }

      const updated = await paymentModel.updateStatus(payment._id, "completed");

      expect(updated).toBeTruthy();
      expect(updated?.status).toBe("completed");
    });

    it("should return null for non-existent payment", async () => {
      const result = await paymentModel.updateStatus(
        new Types.ObjectId().toString(),
        "completed"
      );
      expect(result).toBeNull();
    });
  });

  describe("findByCashRegister", () => {
    it("should find payments by cash register id", async () => {
      const { user } = await createTestUser("employee");
      const register = await createTestCashRegister(user._id.toString());

      const paymentData: Omit<IPayment, "_id" | "createdAt" | "updatedAt"> = {
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "pending",
        cashRegisterId: register._id.toString(),
        createdBy: user._id.toString(),
      };

      await paymentModel.create(paymentData);
      await paymentModel.create({
        ...paymentData,
        amount: 200,
      });

      const payments = await paymentModel.findByCashRegister(
        register._id.toString()
      );

      expect(payments).toHaveLength(2);
      expect(payments[0].cashRegisterId).toBe(register._id.toString());
    });

    it("should filter by payment type", async () => {
      const { user } = await createTestUser("employee");
      const register = await createTestCashRegister(user._id.toString());

      const paymentData: Omit<IPayment, "_id" | "createdAt" | "updatedAt"> = {
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "pending",
        cashRegisterId: register._id.toString(),
        createdBy: user._id.toString(),
      };

      await paymentModel.create(paymentData);
      await paymentModel.create({
        ...paymentData,
        type: "expense",
      });

      const payments = await paymentModel.findByCashRegister(
        register._id.toString(),
        "sale"
      );

      expect(payments).toHaveLength(1);
      expect(payments[0].type).toBe("sale");
    });
  });
});
