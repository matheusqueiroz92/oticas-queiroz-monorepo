import mongoose from "mongoose";
import { PaymentModel } from "../../../models/PaymentModel";
import { Payment } from "../../../schemas/PaymentSchema";
import { CashRegister } from "../../../schemas/CashRegisterSchema";
import { User } from "../../../schemas/UserSchema";
import { Types } from "mongoose";
import type { IPayment } from "../../../interfaces/IPayment";
import { describe, it, expect, beforeEach } from "@jest/globals";

mongoose.model("User", User.schema);
mongoose.model("CashRegister", CashRegister.schema);

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
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "123456",
        role: "employee",
      });

      const register = await CashRegister.create({
        openDate: new Date(),
        openingBalance: 1000,
        currentBalance: 1000,
        status: "open",
        sales: {
          total: 0,
          cash: 0,
          credit: 0,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 0,
          made: 0,
        },
        openedBy: user._id,
      });

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
      // Criar usuário
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "123456",
        role: "employee",
      });

      // Criar caixa
      const register = await CashRegister.create({
        openDate: new Date(),
        openingBalance: 1000,
        currentBalance: 1000,
        status: "open",
        sales: {
          total: 0,
          cash: 0,
          credit: 0,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 0,
          made: 0,
        },
        openedBy: user._id,
      });

      // Criar pagamento
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

      if (!payment._id) {
        throw new Error("Failed to create payment");
      }

      // Buscar com populate
      const found = await Payment.findById(payment._id)
        .populate({
          path: "cashRegisterId",
          select: "_id",
        })
        .populate({
          path: "createdBy",
          select: "_id",
        })
        .lean();

      expect(found?.cashRegisterId._id.toString()).toBe(
        register._id.toString()
      );
      expect(found?.createdBy._id.toString()).toBe(user._id.toString());
    });

    it("should return null for invalid id", async () => {
      const result = await paymentModel.findById("invalid-id");
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return payments with pagination", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "123456",
        role: "employee",
      });

      const register = await CashRegister.create({
        openDate: new Date(),
        openingBalance: 1000,
        currentBalance: 1000,
        status: "open",
        sales: {
          total: 0,
          cash: 0,
          credit: 0,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 0,
          made: 0,
        },
        openedBy: user._id,
      });

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
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "123456",
        role: "employee",
      });

      const register = await CashRegister.create({
        openDate: new Date(),
        openingBalance: 1000,
        currentBalance: 1000,
        status: "open",
        sales: {
          total: 0,
          cash: 0,
          credit: 0,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 0,
          made: 0,
        },
        openedBy: user._id,
      });

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
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "123456",
        role: "employee",
      });

      const register = await CashRegister.create({
        openDate: new Date(),
        openingBalance: 1000,
        currentBalance: 1000,
        status: "open",
        sales: {
          total: 0,
          cash: 0,
          credit: 0,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 0,
          made: 0,
        },
        openedBy: user._id,
      });

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

      if (!payment._id) {
        throw new Error("Failed to create payment");
      }

      const updated = await paymentModel.updateStatus(payment._id, "completed");

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
});
