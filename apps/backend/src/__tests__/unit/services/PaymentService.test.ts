import { PaymentService, PaymentError } from "../../../services/PaymentService";
import { PaymentModel } from "../../../models/PaymentModel";
import { CashRegisterModel } from "../../../models/CashRegisterModel";
import { LegacyClientModel } from "../../../models/LegacyClientModel";
import { OrderModel } from "../../../models/OrderModel";
import { UserModel } from "../../../models/UserModel";
import { Types } from "mongoose";
import type { CreatePaymentDTO, IPayment } from "../../../interfaces/IPayment";
import type { ICashRegister } from "../../../interfaces/ICashRegister";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { ILegacyClient } from "src/interfaces/ILegacyClient";

jest.mock("../../../models/PaymentModel");
jest.mock("../../../models/CashRegisterModel");
jest.mock("../../../models/LegacyClientModel");
jest.mock("../../../models/OrderModel");
jest.mock("../../../models/UserModel");

interface PaymentServiceWithModels {
  paymentModel: jest.Mocked<PaymentModel>;
  cashRegisterModel: jest.Mocked<CashRegisterModel>;
  legacyClientModel: jest.Mocked<LegacyClientModel>;
  orderModel: jest.Mocked<OrderModel>;
  userModel: jest.Mocked<UserModel>;
}

describe("PaymentService", () => {
  let paymentService: PaymentService;
  let paymentModel: jest.Mocked<PaymentModel>;
  let cashRegisterModel: jest.Mocked<CashRegisterModel>;
  let legacyClientModel: jest.Mocked<LegacyClientModel>;
  let orderModel: jest.Mocked<OrderModel>;
  let userModel: jest.Mocked<UserModel>;

  beforeEach(() => {
    paymentModel = new PaymentModel() as jest.Mocked<PaymentModel>;
    cashRegisterModel =
      new CashRegisterModel() as jest.Mocked<CashRegisterModel>;
    legacyClientModel =
      new LegacyClientModel() as jest.Mocked<LegacyClientModel>;
    orderModel = new OrderModel() as jest.Mocked<OrderModel>;
    userModel = new UserModel() as jest.Mocked<UserModel>;

    paymentService = new PaymentService();
    (paymentService as unknown as PaymentServiceWithModels).paymentModel =
      paymentModel;
    (paymentService as unknown as PaymentServiceWithModels).cashRegisterModel =
      cashRegisterModel;
    (paymentService as unknown as PaymentServiceWithModels).legacyClientModel =
      legacyClientModel;
    (paymentService as unknown as PaymentServiceWithModels).orderModel =
      orderModel;
    (paymentService as unknown as PaymentServiceWithModels).userModel =
      userModel;
  });

  const mockUserId = new Types.ObjectId().toString();
  const mockCashRegisterId = new Types.ObjectId().toString();

  const mockPayment: Omit<IPayment, "_id" | "createdAt" | "updatedAt"> = {
    amount: 100,
    date: new Date(),
    type: "sale",
    paymentMethod: "credit",
    status: "pending",
    cashRegisterId: mockCashRegisterId,
    createdBy: mockUserId,
  };

  const testId = new Types.ObjectId().toString();

  const mockCashRegister: ICashRegister = {
    _id: testId,
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
    openedBy: new Types.ObjectId().toString(),
  };

  describe("createPayment", () => {
    it("should create a payment successfully", async () => {
      cashRegisterModel.findOpenRegister.mockResolvedValue({
        ...mockCashRegister,
        _id: mockCashRegisterId,
      });
      paymentModel.create.mockResolvedValue({
        _id: "123",
        ...mockPayment,
      } as IPayment);
      cashRegisterModel.updateSalesAndPayments.mockResolvedValue({
        ...mockCashRegister,
        _id: mockCashRegisterId,
        currentBalance: 1100,
      });

      const result = await paymentService.createPayment(mockPayment);

      expect(result._id).toBe("123");
      expect(cashRegisterModel.updateSalesAndPayments).toHaveBeenCalledWith(
        mockCashRegisterId,
        "sale",
        100,
        "credit"
      );
    });

    it("should throw error if no open register exists", async () => {
      cashRegisterModel.findOpenRegister.mockResolvedValue(null);

      const paymentData: CreatePaymentDTO = {
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "pending",
        createdBy: new Types.ObjectId().toString(),
        cashRegisterId: testId,
      };

      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(
        new PaymentError("Não há caixa aberto no momento")
      );
    });

    it("should handle installment payment", async () => {
      // Mock do caixa aberto
      const mockRegisterId = new Types.ObjectId().toString();
      cashRegisterModel.findOpenRegister.mockResolvedValue({
        ...mockCashRegister,
        _id: mockRegisterId,
      });

      const installmentPayment: CreatePaymentDTO = {
        amount: 300,
        date: new Date(),
        type: "sale",
        paymentMethod: "installment",
        status: "pending",
        installments: {
          current: 1,
          total: 3,
          value: 100,
        },
        createdBy: new Types.ObjectId().toString(),
        cashRegisterId: mockRegisterId,
      };

      // Mock da criação do pagamento
      paymentModel.create.mockResolvedValue({
        _id: new Types.ObjectId().toString(),
        ...installmentPayment,
      });

      // Mock da atualização do caixa
      cashRegisterModel.updateSalesAndPayments.mockResolvedValue({
        ...mockCashRegister,
        currentBalance: 1300,
      });

      const result = await paymentService.createPayment(installmentPayment);

      expect(result.paymentMethod).toBe("installment");
      expect(result.installments?.total).toBe(3);
      expect(cashRegisterModel.updateSalesAndPayments).toHaveBeenCalled();
    });
  });

  describe("getPaymentById", () => {
    it("should return payment by id", async () => {
      paymentModel.findById.mockResolvedValue({
        _id: "123",
        ...mockPayment,
      } as IPayment);

      const result = await paymentService.getPaymentById("123");

      expect(result._id).toBe("123");
    });

    it("should throw error if payment not found", async () => {
      paymentModel.findById.mockResolvedValue(null);

      await expect(paymentService.getPaymentById("123")).rejects.toThrow(
        "Pagamento não encontrado"
      );
    });

    it("should handle debt payment", async () => {
      // const mockLegacyClientId = new Types.ObjectId().toString();
      const mockRegisterId = new Types.ObjectId().toString();

      const mockLegacyClient: ILegacyClient = {
        name: "Legacy Client Test",
        documentId: "111.222.333.444-55",
        totalDebt: 0,
        paymentHistory: [],
        status: "active",
      };

      legacyClientModel.create.mockResolvedValue({
        ...mockLegacyClient,
        _id: mockLegacyClient._id,
      });

      cashRegisterModel.findOpenRegister.mockResolvedValue({
        ...mockCashRegister,
        _id: mockRegisterId,
      });

      const debtPayment: CreatePaymentDTO = {
        amount: 200,
        date: new Date(),
        type: "debt_payment",
        paymentMethod: "cash",
        status: "pending",
        legacyClientId: mockLegacyClient._id,
        createdBy: new Types.ObjectId().toString(),
        cashRegisterId: mockRegisterId,
      };

      paymentModel.create.mockResolvedValue({
        _id: new Types.ObjectId().toString(),
        ...debtPayment,
      });

      cashRegisterModel.updateSalesAndPayments.mockResolvedValue({
        ...mockCashRegister,
        currentBalance: 1200,
      });

      const result = await paymentService.createPayment(debtPayment);

      expect(result.type).toBe("debt_payment");
      expect(result.amount).toBe(200);
      expect(cashRegisterModel.updateSalesAndPayments).toHaveBeenCalled();
    });
  });

  describe("cancelPayment", () => {
    it("should cancel payment successfully", async () => {
      const mockPaymentWithId = {
        _id: "123",
        ...mockPayment,
        status: "completed",
      } as IPayment;

      paymentModel.findById.mockResolvedValue(mockPaymentWithId);
      cashRegisterModel.findById.mockResolvedValue(mockCashRegister);
      cashRegisterModel.updateSalesAndPayments.mockResolvedValue(
        mockCashRegister
      );
      paymentModel.updateStatus.mockResolvedValue({
        ...mockPaymentWithId,
        status: "cancelled",
      } as IPayment);

      const result = await paymentService.cancelPayment("123", mockUserId);

      expect(result.status).toBe("cancelled");
      expect(cashRegisterModel.updateSalesAndPayments).toHaveBeenCalled();
    });

    it("should throw error if payment already cancelled", async () => {
      paymentModel.findById.mockResolvedValue({
        ...mockPayment,
        status: "cancelled",
      } as IPayment);

      await expect(
        paymentService.cancelPayment("123", mockUserId)
      ).rejects.toThrow("Pagamento já está cancelado");
    });
  });
});
