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
    openingDate: new Date(), // Usando openingDate ao invés de openDate
    openingBalance: 1000,
    currentBalance: 1000,
    status: "open",
    sales: {
      total: 0,
      cash: 0,
      credit: 0,
      debit: 0,
      pix: 0,
      check: 0, // Adicionando campo check que estava faltando
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
      expect(register.openingDate).toBeDefined();
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

      await cashRegisterModel.create({
        ...mockCashRegister,
        openingDate: yesterday,
      });

      const startDate = new Date(yesterday);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      const registers = await cashRegisterModel.findByDateRange(startDate, endDate);

      expect(registers).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("should update cash register", async () => {
      const register = await cashRegisterModel.create(mockCashRegister);

      const updateData = {
        currentBalance: 1500,
        sales: {
          total: 500,
          cash: 300,
          credit: 200,
          debit: 0,
          pix: 0,
          check: 0,
        },
      };

      const updatedRegister = await cashRegisterModel.update(
        register._id!.toString(),
        updateData
      );

      expect(updatedRegister?.currentBalance).toBe(1500);
      expect(updatedRegister?.sales.total).toBe(500);
    });
  });

  describe("close", () => {
    it("should close cash register", async () => {
      const register = await cashRegisterModel.create(mockCashRegister);

      const closeData = {
        closingBalance: 1200,
        closingDate: new Date(),
        closedBy: mockUserId.toString(),
        status: "closed" as const,
      };

      const closedRegister = await cashRegisterModel.close(
        register._id!.toString(),
        closeData
      );

      expect(closedRegister?.status).toBe("closed");
      expect(closedRegister?.closingBalance).toBe(1200);
      expect(closedRegister?.closingDate).toBeDefined();
    });
  });

  describe("getSummary", () => {
    it("should get cash register summary", async () => {
      const register = await cashRegisterModel.create({
        ...mockCashRegister,
        sales: {
          total: 1000,
          cash: 400,
          credit: 300,
          debit: 200,
          pix: 100,
          check: 0,
        },
        payments: {
          received: 800,
          made: 200,
        },
      });

      const summary = await cashRegisterModel.getSummary(register._id!.toString());

      expect(summary).toHaveProperty("register");
      expect(summary).toHaveProperty("sales");
      expect(summary).toHaveProperty("payments");
      expect(summary.sales.total).toBe(1000);
      expect(summary.payments.received).toBe(800);
    });
  });

  describe("findAll", () => {
    it("should return all registers with pagination", async () => {
      await cashRegisterModel.create(mockCashRegister);
      await cashRegisterModel.create({
        ...mockCashRegister,
        openingBalance: 2000,
        currentBalance: 2000,
      });

      const result = await cashRegisterModel.findAll(1, 10);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe("findById", () => {
    it("should find register by id", async () => {
      const register = await cashRegisterModel.create(mockCashRegister);

      const found = await cashRegisterModel.findById(register._id!.toString());

      expect(found?._id).toEqual(register._id);
      expect(found?.openingBalance).toBe(1000);
    });

    it("should return null for invalid id", async () => {
      const result = await cashRegisterModel.findById("invalid-id");
      expect(result).toBeNull();
    });
  });
});
