import { PaymentStatusService } from "../../../services/PaymentStatusService";
import { RepositoryFactory } from "../../../repositories/RepositoryFactory";
import { ICashRegisterRepository } from "../../../repositories/interfaces/ICashRegisterRepository";
import { IOrderRepository } from "../../../repositories/interfaces/IOrderRepository";
import { IPaymentRepository } from "../../../repositories/interfaces/IPaymentRepository";
import { IPayment } from "../../../interfaces/IPayment";
import { IOrder } from "../../../interfaces/IOrder";
import { ICashRegister } from "../../../interfaces/ICashRegister";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock do RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory");

describe("PaymentStatusService", () => {
  let paymentStatusService: PaymentStatusService;
  let mockCashRegisterRepository: jest.Mocked<ICashRegisterRepository>;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
  let mockRepositoryFactory: jest.Mocked<RepositoryFactory>;

  beforeEach(() => {
    // Setup dos mocks dos repositories
    mockCashRegisterRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findOpenRegister: jest.fn(),
      findByStatus: jest.fn(),
      findByOpeningDate: jest.fn(),
      findByOpenedBy: jest.fn(),
      findByClosedBy: jest.fn(),
      closeRegister: jest.fn(),
      updateBalance: jest.fn(),
      updateSales: jest.fn(),
      updatePayments: jest.fn(),
      findDailySummary: jest.fn(),
      findWithDifference: jest.fn(),
      getStatistics: jest.fn(),
    };

    mockOrderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByClientId: jest.fn(),
      findByEmployeeId: jest.fn(),
      findByDateRange: jest.fn(),
      updateOrderStatus: jest.fn(),
      calculateOrderMetrics: jest.fn(),
      findOverdueOrders: jest.fn(),
      findByStatus: jest.fn(),
      getOrderStatistics: jest.fn(),
      findByLaboratory: jest.fn(),
      getRevenueSummary: jest.fn(),
    } as any;

    mockPaymentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByOrderId: jest.fn(),
      findByClientId: jest.fn(),
      findByCashRegisterId: jest.fn(),
      findByType: jest.fn(),
      findByPaymentMethod: jest.fn(),
      findByStatus: jest.fn(),
      findByDateRange: jest.fn(),
      findChecksByStatus: jest.fn(),
      findDailyPayments: jest.fn(),
      findWithMongoFilters: jest.fn(),
      calculateTotalByPeriod: jest.fn(),
      getPaymentMethodStats: jest.fn(),
      findPendingByClientId: jest.fn(),
      cancel: jest.fn(),
      getRevenueSummary: jest.fn(),
    };

    mockRepositoryFactory = {
      getCashRegisterRepository: jest.fn().mockReturnValue(mockCashRegisterRepository),
      getOrderRepository: jest.fn().mockReturnValue(mockOrderRepository),
      getPaymentRepository: jest.fn().mockReturnValue(mockPaymentRepository),
    } as any;

    (RepositoryFactory.getInstance as jest.Mock).mockReturnValue(mockRepositoryFactory);

    paymentStatusService = new PaymentStatusService();
  });

  const mockCashRegister: ICashRegister = {
    _id: "register123",
    openingDate: new Date(),
    openingBalance: 100,
    currentBalance: 500,
    status: "open",
    sales: {
      total: 400,
      cash: 200,
      credit: 100,
      debit: 50,
      pix: 50,
      check: 0,
    },
    payments: {
      received: 400,
      made: 0,
    },
    openedBy: "user123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder: IOrder = {
    _id: "order123",
    clientId: "client123",
    employeeId: "employee123",
    products: [],
    paymentMethod: "cash",
    totalPrice: 500,
    paymentStatus: "pending",
    paymentHistory: [],
    status: "pending",
    orderDate: new Date(),
    discount: 0,
    finalPrice: 500,
    deliveryDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockPayment: IPayment = {
    _id: "payment123",
    amount: 100,
    paymentMethod: "cash",
    status: "completed",
    type: "sale",
    orderId: "order123",
    cashRegisterId: "register123",
    createdBy: "user123",
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("updateCashRegister", () => {
    it("should update cash register with payment", async () => {
      mockCashRegisterRepository.findById.mockResolvedValue(mockCashRegister);
      mockCashRegisterRepository.updateSales.mockResolvedValue(mockCashRegister);
      mockCashRegisterRepository.updatePayments.mockResolvedValue(mockCashRegister);

      await paymentStatusService.updateCashRegister("register123", mockPayment);

      expect(mockCashRegisterRepository.findById).toHaveBeenCalledWith("register123");
      expect(mockCashRegisterRepository.updateSales).toHaveBeenCalled();
      expect(mockCashRegisterRepository.updatePayments).toHaveBeenCalled();
    });

    it("should throw error if cash register not found", async () => {
      mockCashRegisterRepository.findById.mockResolvedValue(null);

      await expect(
        paymentStatusService.updateCashRegister("nonexistent", mockPayment)
      ).rejects.toThrow("Caixa não encontrado");
    });
  });

  describe("updateOrderPaymentStatus", () => {
    it("should update order payment status to paid", async () => {
      const completedPayments = [
        { ...mockPayment, amount: 500, status: "completed" as const },
      ];

      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPaymentRepository.findAll.mockResolvedValue({
        items: completedPayments,
        total: 1,
        page: 1,
        limit: 1000,
      });
      mockOrderRepository.update.mockResolvedValue({ ...mockOrder, paymentStatus: "paid" });

      await paymentStatusService.updateOrderPaymentStatus("order123");

      expect(mockOrderRepository.findById).toHaveBeenCalledWith("order123");
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 1000, { orderId: "order123" });
      expect(mockOrderRepository.update).toHaveBeenCalledWith("order123", 
        expect.objectContaining({ paymentStatus: "paid" })
      );
    });

    it("should update order payment status to partially_paid", async () => {
      const partialPayments = [
        { ...mockPayment, amount: 200, status: "completed" as const },
      ];

      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPaymentRepository.findAll.mockResolvedValue({
        items: partialPayments,
        total: 1,
        page: 1,
        limit: 1000,
      });
      mockOrderRepository.update.mockResolvedValue({ ...mockOrder, paymentStatus: "partially_paid" });

      await paymentStatusService.updateOrderPaymentStatus("order123");

      expect(mockOrderRepository.update).toHaveBeenCalledWith("order123", 
        expect.objectContaining({ paymentStatus: "partially_paid" })
      );
    });

    it("should add payment to history", async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1000,
      });
      mockOrderRepository.update.mockResolvedValue(mockOrder);

      await paymentStatusService.updateOrderPaymentStatus(
        "order123",
        "payment123",
        100,
        "cash"
      );

      expect(mockOrderRepository.update).toHaveBeenCalledWith("order123", 
        expect.objectContaining({
          paymentHistory: expect.arrayContaining([
            expect.objectContaining({
              paymentId: "payment123",
              amount: 100,
              method: "cash",
            })
          ])
        })
      );
    });

    it("should throw error if order not found", async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        paymentStatusService.updateOrderPaymentStatus("nonexistent")
      ).rejects.toThrow("Pedido não encontrado");
    });
  });

  describe("recalculateOrderPaymentStatus", () => {
    it("should recalculate order payment status", async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1000,
      });
      mockOrderRepository.update.mockResolvedValue(mockOrder);

      await paymentStatusService.recalculateOrderPaymentStatus("order123");

      expect(mockOrderRepository.findById).toHaveBeenCalledWith("order123");
      expect(mockOrderRepository.update).toHaveBeenCalled();
    });
  });

  describe("updateCheckCompensationStatus", () => {
    it("should update check status to compensated", async () => {
      const checkPayment = { ...mockPayment, paymentMethod: "check" as const };
      const updatedPayment = { ...checkPayment, status: "completed" as const };

      mockPaymentRepository.findById.mockResolvedValue(checkPayment);
      mockPaymentRepository.update.mockResolvedValue(updatedPayment);

      const result = await paymentStatusService.updateCheckCompensationStatus("payment123", "compensated");

      expect(result).toEqual(updatedPayment);
      expect(mockPaymentRepository.update).toHaveBeenCalledWith("payment123", 
        expect.objectContaining({ status: "completed" })
      );
    });

    it("should update check status to rejected with reason", async () => {
      const checkPayment = { ...mockPayment, paymentMethod: "check" as const };
      const updatedPayment = { ...checkPayment, status: "cancelled" as const };

      mockPaymentRepository.findById.mockResolvedValue(checkPayment);
      mockPaymentRepository.update.mockResolvedValue(updatedPayment);

      await paymentStatusService.updateCheckCompensationStatus("payment123", "rejected", "Insufficient funds");

      expect(mockPaymentRepository.update).toHaveBeenCalledWith("payment123", 
        expect.objectContaining({
          status: "cancelled",
          description: expect.stringContaining("Insufficient funds")
        })
      );
    });

    it("should throw error for non-check payment", async () => {
      mockPaymentRepository.findById.mockResolvedValue(mockPayment); // paymentMethod: "cash"

      await expect(
        paymentStatusService.updateCheckCompensationStatus("payment123", "compensated")
      ).rejects.toThrow("Pagamento não encontrado ou não é um cheque");
    });

    it("should throw error if payment not found", async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(
        paymentStatusService.updateCheckCompensationStatus("nonexistent", "compensated")
      ).rejects.toThrow("Pagamento não encontrado ou não é um cheque");
    });
  });

  describe("getChecksByStatus", () => {
    it("should return checks by compensated status", async () => {
      const checkPayments = [
        { ...mockPayment, paymentMethod: "check" as const, status: "completed" as const },
      ];

      mockPaymentRepository.findAll.mockResolvedValue({
        items: checkPayments,
        total: 1,
        page: 1,
        limit: 1000,
      });

      const result = await paymentStatusService.getChecksByStatus("compensated");

      expect(result).toEqual(checkPayments);
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 1000, {
        paymentMethod: "check",
        status: "completed",
      });
    });

    it("should filter checks by date range", async () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");
      const checkPayments = [
        { ...mockPayment, paymentMethod: "check" as const, createdAt: new Date("2023-06-15") },
      ];

      mockPaymentRepository.findAll.mockResolvedValue({
        items: checkPayments,
        total: 1,
        page: 1,
        limit: 1000,
      });

      const result = await paymentStatusService.getChecksByStatus("pending", startDate, endDate);

      expect(result).toEqual(checkPayments);
    });

    it("should exclude checks outside date range", async () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");
      const checkPayments = [
        { ...mockPayment, paymentMethod: "check" as const, createdAt: new Date("2022-12-15") },
      ];

      mockPaymentRepository.findAll.mockResolvedValue({
        items: checkPayments,
        total: 1,
        page: 1,
        limit: 1000,
      });

      const result = await paymentStatusService.getChecksByStatus("pending", startDate, endDate);

      expect(result).toEqual([]);
    });
  });

  describe("cancelPayment", () => {
    it("should cancel payment and revert cash register changes", async () => {
      const cancelledPayment = { ...mockPayment, status: "cancelled" as const };

      mockPaymentRepository.findById.mockResolvedValue(mockPayment);
      mockCashRegisterRepository.findById.mockResolvedValue(mockCashRegister);
      mockCashRegisterRepository.updateSales.mockResolvedValue(mockCashRegister);
      mockCashRegisterRepository.updatePayments.mockResolvedValue(mockCashRegister);
      mockPaymentRepository.update.mockResolvedValue(cancelledPayment);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1000,
      });
      mockOrderRepository.update.mockResolvedValue(mockOrder);

      const result = await paymentStatusService.cancelPayment("payment123", "user456");

      expect(result).toEqual(cancelledPayment);
      expect(mockPaymentRepository.update).toHaveBeenCalledWith("payment123", 
        expect.objectContaining({
          status: "cancelled",
          description: expect.stringContaining("user456")
        })
      );
    });

    it("should throw error if payment not found", async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(
        paymentStatusService.cancelPayment("nonexistent", "user456")
      ).rejects.toThrow("Pagamento não encontrado");
    });

    it("should throw error if payment already cancelled", async () => {
      const cancelledPayment = { ...mockPayment, status: "cancelled" as const };
      mockPaymentRepository.findById.mockResolvedValue(cancelledPayment);

      await expect(
        paymentStatusService.cancelPayment("payment123", "user456")
      ).rejects.toThrow("Pagamento já foi cancelado");
    });

    it("should throw error if payment update fails", async () => {
      mockPaymentRepository.findById.mockResolvedValue(mockPayment);
      mockCashRegisterRepository.findById.mockResolvedValue(mockCashRegister);
      mockCashRegisterRepository.updateSales.mockResolvedValue(mockCashRegister);
      mockCashRegisterRepository.updatePayments.mockResolvedValue(mockCashRegister);
      mockPaymentRepository.update.mockResolvedValue(null);

      await expect(
        paymentStatusService.cancelPayment("payment123", "user456")
      ).rejects.toThrow("Erro ao cancelar pagamento");
    });
  });
}); 