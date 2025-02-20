import { CashRegisterModel } from "../../../models/CashRegisterModel";
import { CashRegister } from "../../../schemas/CashRegisterSchema";
import { Types } from "mongoose";
import type { ICashRegister } from "../../../interfaces/ICashRegister";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("CashRegisterModel", () => {
  let cashRegisterModel: CashRegisterModel;

  beforeEach(async () => {
    await CashRegister.deleteMany({});
    cashRegisterModel = new CashRegisterModel();
  });

  const mockUserId = new Types.ObjectId();

  const mockCashRegister: Omit<
    ICashRegister,
    "_id" | "createdAt" | "updatedAt"
  > = {
    openingDate: new Date(),
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
    openedBy: mockUserId.toString(),
  };

  describe("create", () => {
    it("should create a cash register", async () => {
      const register = await cashRegisterModel.create(mockCashRegister);

      expect(register).toHaveProperty("_id");
      expect(register.openingBalance).toBe(1000);
      expect(register.currentBalance).toBe(1000);
      expect(register.status).toBe("open");
      expect(register.sales.total).toBe(0);
    });
  });

  describe("findOpenRegister", () => {
    it("should find open register", async () => {
      await cashRegisterModel.create(mockCashRegister);

      const openRegister = await cashRegisterModel.findOpenRegister();

      expect(openRegister?.status).toBe("open");
      expect(openRegister?.openingBalance).toBe(1000);
    });

    it("should return null when no open register exists", async () => {
      const closedRegister = {
        ...mockCashRegister,
        status: "closed" as const,
        closingBalance: 1000,
        closingDate: new Date(),
        closedBy: mockUserId.toString(),
      };

      await cashRegisterModel.create(closedRegister);

      const openRegister = await cashRegisterModel.findOpenRegister();

      expect(openRegister).toBeNull();
    });
  });

  describe("findByDateRange", () => {
    it("should find registers within date range", async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await cashRegisterModel.create({
        ...mockCashRegister,
        openingDate: today,
      });

      const registers = await cashRegisterModel.findByDateRange(
        yesterday,
        today
      );

      expect(registers).toHaveLength(1);
    });

    it("should exclude registers outside date range", async () => {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      await cashRegisterModel.create({
        ...mockCashRegister,
        openingDate: lastWeek,
      });

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const registers = await cashRegisterModel.findByDateRange(
        yesterday,
        today
      );

      expect(registers).toHaveLength(0);
    });
  });

  describe("updateSalesAndPayments", () => {
    it("should update cash sales correctly", async () => {
      const created = await cashRegisterModel.create(mockCashRegister);

      if (!created?._id) {
        throw new Error("Failed to create cash register");
      }

      const updated = await cashRegisterModel.updateSalesAndPayments(
        created._id,
        "sale",
        100,
        "cash"
      );

      expect(updated?.currentBalance).toBe(1100);
      expect(updated?.sales.total).toBe(100);
      expect(updated?.sales.cash).toBe(100);
    });

    it("should update credit sales correctly", async () => {
      const created = await cashRegisterModel.create(mockCashRegister);

      if (!created?._id) {
        throw new Error("Failed to create cash register");
      }

      const updated = await cashRegisterModel.updateSalesAndPayments(
        created._id,
        "sale",
        100,
        "credit"
      );

      expect(updated?.currentBalance).toBe(1100);
      expect(updated?.sales.total).toBe(100);
      expect(updated?.sales.credit).toBe(100);
    });

    it("should update debt payments correctly", async () => {
      const created = await cashRegisterModel.create(mockCashRegister);

      if (!created?._id) {
        throw new Error("Failed to create cash register");
      }

      const updated = await cashRegisterModel.updateSalesAndPayments(
        created._id,
        "debt_payment",
        100
      );

      expect(updated?.currentBalance).toBe(1100);
      expect(updated?.payments.received).toBe(100);
    });

    it("should update expenses correctly", async () => {
      const created = await cashRegisterModel.create(mockCashRegister);

      if (!created?._id) {
        throw new Error("Failed to create cash register");
      }

      const updated = await cashRegisterModel.updateSalesAndPayments(
        created._id,
        "expense",
        -50
      );

      expect(updated?.currentBalance).toBe(950);
      expect(updated?.payments.made).toBe(50);
    });
  });

  describe("closeRegister", () => {
    it("should close register successfully", async () => {
      const created = await cashRegisterModel.create(mockCashRegister);

      if (!created?._id) {
        throw new Error("Failed to create cash register");
      }

      const closed = await cashRegisterModel.closeRegister(created._id, {
        closingBalance: 1500,
        closedBy: mockUserId.toString(),
        observations: "Test closing",
      });

      expect(closed?.status).toBe("closed");
      expect(closed?.closingBalance).toBe(1500);
      expect(closed?.closedBy).toBe(mockUserId.toString());
      expect(closed?.closingDate).toBeDefined();
    });

    it("should return null for invalid register id", async () => {
      const result = await cashRegisterModel.closeRegister(
        new Types.ObjectId().toString(),
        {
          closingBalance: 1000,
          closedBy: mockUserId.toString(),
        }
      );

      expect(result).toBeNull();
    });
  });
});
