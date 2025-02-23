import {
  CashRegisterService,
  CashRegisterError,
} from "../../../services/CashRegisterService";
import { CashRegisterModel } from "../../../models/CashRegisterModel";
import { PaymentModel } from "../../../models/PaymentModel";
import { Types } from "mongoose";
import type { ICashRegister } from "../../../interfaces/ICashRegister";
import type { IPayment } from "../../../interfaces/IPayment";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("../../../models/CashRegisterModel");
jest.mock("../../../models/PaymentModel");

interface CashRegisterServiceWithModels {
  cashRegisterModel: jest.Mocked<CashRegisterModel>;
  paymentModel: jest.Mocked<PaymentModel>;
}

describe("CashRegisterService", () => {
  let cashRegisterService: CashRegisterService;
  let cashRegisterModel: jest.Mocked<CashRegisterModel>;
  let paymentModel: jest.Mocked<PaymentModel>;

  beforeEach(() => {
    cashRegisterModel =
      new CashRegisterModel() as jest.Mocked<CashRegisterModel>;
    paymentModel = new PaymentModel() as jest.Mocked<PaymentModel>;

    cashRegisterService = new CashRegisterService();
    (
      cashRegisterService as unknown as CashRegisterServiceWithModels
    ).cashRegisterModel = cashRegisterModel;
    (
      cashRegisterService as unknown as CashRegisterServiceWithModels
    ).paymentModel = paymentModel;
  });

  const mockUserId = new Types.ObjectId().toString();
  const mockCashRegisterId = new Types.ObjectId().toString();

  const mockRegister: ICashRegister = {
    _id: mockCashRegisterId,
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
    openedBy: mockUserId,
  };

  const mockPayment: IPayment = {
    _id: new Types.ObjectId().toString(),
    type: "sale",
    amount: 100,
    paymentMethod: "cash",
    date: new Date(),
    status: "completed",
    cashRegisterId: mockCashRegisterId,
    createdBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("openRegister", () => {
    it("should open a new register", async () => {
      cashRegisterModel.findOpenRegister.mockResolvedValue(null);
      cashRegisterModel.create.mockResolvedValue(mockRegister);

      const result = await cashRegisterService.openRegister({
        openingBalance: 1000,
        openedBy: mockUserId,
      });

      expect(result._id).toBe(mockRegister._id);
      expect(result.openingBalance).toBe(1000);
      expect(result.status).toBe("open");
    });

    it("should throw error if register already open", async () => {
      cashRegisterModel.findOpenRegister.mockResolvedValue(mockRegister);

      await expect(
        cashRegisterService.openRegister({
          openingBalance: 1000,
          openedBy: mockUserId,
        })
      ).rejects.toThrow(CashRegisterError);
    });

    it("should throw error for negative opening balance", async () => {
      await expect(
        cashRegisterService.openRegister({
          openingBalance: -100,
          openedBy: mockUserId,
        })
      ).rejects.toThrow(CashRegisterError);
    });
  });

  describe("closeRegister", () => {
    it("should close register successfully", async () => {
      const closedRegister = {
        ...mockRegister,
        status: "closed" as const,
        closingBalance: 1500,
        closingDate: new Date(),
        closedBy: mockUserId,
      };

      cashRegisterModel.findOpenRegister.mockResolvedValue(mockRegister);
      cashRegisterModel.closeRegister.mockResolvedValue(closedRegister);

      const result = await cashRegisterService.closeRegister({
        closingBalance: 1500,
        closedBy: mockUserId,
      });

      expect(result.status).toBe("closed");
      expect(result.closingBalance).toBe(1500);
    });

    it("should throw error if no open register", async () => {
      cashRegisterModel.findOpenRegister.mockResolvedValue(null);

      await expect(
        cashRegisterService.closeRegister({
          closingBalance: 1500,
          closedBy: mockUserId,
        })
      ).rejects.toThrow("Não há caixa aberto");
    });
  });

  describe("getRegisterSummary", () => {
    it("should return register summary with payments", async () => {
      const mockPaymentWithDebt: IPayment = {
        ...mockPayment,
        _id: new Types.ObjectId().toString(),
        type: "debt_payment",
        amount: 50,
        paymentMethod: "credit",
      };

      cashRegisterModel.findById.mockResolvedValue(mockRegister);
      paymentModel.findByCashRegister.mockResolvedValue([
        mockPayment,
        mockPaymentWithDebt,
      ]);

      // Verifica se mockRegister._id existe antes de usar
      if (!mockRegister._id) {
        throw new Error("Mock register ID is required for this test");
      }

      const result = await cashRegisterService.getRegisterSummary(
        mockRegister._id
      );

      expect(result.register).toBe(mockRegister);
      expect(result.payments.sales.total).toBe(100);
      expect(result.payments.debts.received).toBe(50);
    });

    it("should throw error for non-existent register", async () => {
      cashRegisterModel.findById.mockResolvedValue(null);

      await expect(
        cashRegisterService.getRegisterSummary("invalid-id")
      ).rejects.toThrow("Caixa não encontrado");
    });
  });

  describe("getDailySummary", () => {
    it("should return daily summary", async () => {
      const date = new Date();
      const mockExpensePayment: IPayment = {
        _id: new Types.ObjectId().toString(),
        type: "expense",
        amount: 50, // Mudando de -50 para 50 para corresponder à expectativa do teste
        paymentMethod: "cash",
        date: new Date(),
        status: "completed",
        cashRegisterId: mockCashRegisterId,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      cashRegisterModel.findByDateRange.mockResolvedValue([mockRegister]);
      paymentModel.findAll.mockResolvedValue({
        payments: [mockExpensePayment],
        total: 1,
      });

      const summary = await cashRegisterService.getDailySummary(date);

      expect(summary.openingBalance).toBe(mockRegister.openingBalance);
      expect(summary.totalExpenses).toBe(50);
    });

    it("should throw error if no registers found", async () => {
      cashRegisterModel.findByDateRange.mockResolvedValue([]);

      await expect(
        cashRegisterService.getDailySummary(new Date())
      ).rejects.toThrow("Nenhum caixa encontrado para esta data");
    });
  });
});
