// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const mockGetOrderById = jest.fn();
const mockGetOrderPayments = jest.fn();
const mockCreatePayment = jest.fn();
const mockGenerateSicrediBoleto = jest.fn();
const mockValidateAndGetOpenRegister = jest.fn();
const mockPaymentFindById = jest.fn();
const mockPaymentUpdate = jest.fn();

jest.mock("../../../services/OrderService", () => ({
  OrderService: class MockOrderService {
    getOrderById = mockGetOrderById;
    getOrderPayments = mockGetOrderPayments;
  },
}));

jest.mock("../../../services/PaymentService", () => ({
  PaymentService: class MockPaymentService {
    createPayment = mockCreatePayment;
    generateSicrediBoleto = mockGenerateSicrediBoleto;
  },
}));

jest.mock("../../../services/PaymentValidationService", () => ({
  PaymentValidationService: class MockPaymentValidationService {
    validateAndGetOpenRegister = mockValidateAndGetOpenRegister;
  },
}));

const mockCashRegisterFindById = jest.fn();

jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: () => ({
    paymentRepository: {
      findById: mockPaymentFindById,
      update: mockPaymentUpdate,
    },
    cashRegisterRepository: {
      findById: mockCashRegisterFindById,
    },
  }),
}));

import {
  OrderSicrediBoletoService,
  OrderSicrediBoletoError,
} from "../../../services/OrderSicrediBoletoService";

describe("OrderSicrediBoletoService", () => {
  let service: OrderSicrediBoletoService;

  const customerData = {
    cpfCnpj: "12345678901",
    nome: "Cliente Teste",
    endereco: {
      logradouro: "Rua A",
      numero: "10",
      bairro: "Centro",
      cidade: "São Paulo",
      uf: "SP",
      cep: "01001000",
    },
  };

  const baseOrder = {
    _id: "order-123",
    clientId: "client-1",
    paymentMethod: "sicredi_boleto",
    serviceOrder: "300001",
    finalPrice: 500,
    paymentEntry: 100,
    totalPrice: 500,
    discount: 0,
    deliveryDate: new Date("2026-06-15"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderSicrediBoletoService();
    mockGetOrderById.mockResolvedValue(baseOrder);
    mockGetOrderPayments.mockResolvedValue([]);
    mockValidateAndGetOpenRegister.mockResolvedValue("cash-register-1");
    mockCreatePayment.mockResolvedValue({
      _id: "payment-1",
      amount: 400,
      paymentMethod: "sicredi_boleto",
      bank_slip: { sicredi: { dataVencimento: new Date("2026-06-15") } },
    });
    mockGenerateSicrediBoleto.mockResolvedValue({
      success: true,
      data: {
        nossoNumero: "999888777",
        codigoBarras: "123",
        linhaDigitavel: "456",
      },
    });
    mockPaymentFindById.mockResolvedValue({
      _id: "payment-1",
      bank_slip: {
        sicredi: {
          nossoNumero: "999888777",
          codigoBarras: "123",
          linhaDigitavel: "456",
        },
      },
    });
  });

  it("should reject orders without sicredi_boleto payment method", async () => {
    mockGetOrderById.mockResolvedValue({ ...baseOrder, paymentMethod: "cash" });

    await expect(
      service.emitBoletoForOrder("order-123", "employee-1", customerData)
    ).rejects.toThrow(OrderSicrediBoletoError);
  });

  it("should create payment and generate boleto for sicredi order", async () => {
    const result = await service.emitBoletoForOrder(
      "order-123",
      "employee-1",
      customerData
    );

    expect(mockCreatePayment).toHaveBeenCalled();
    expect(mockGenerateSicrediBoleto).toHaveBeenCalledWith(
      "payment-1",
      customerData,
        expect.objectContaining({
        seuNumero: "30000101",
        mensagem: ["O.S. 300001 - Oticas Queiroz"],
      })
    );
    expect(result.boleto.nossoNumero).toBe("999888777");
  });

  it("should return existing boleto if already issued", async () => {
    mockGetOrderPayments.mockResolvedValue([
      {
        _id: "payment-existing",
        paymentMethod: "sicredi_boleto",
        bank_slip: {
          sicredi: {
            nossoNumero: "111222333",
            codigoBarras: "abc",
            linhaDigitavel: "def",
            installmentNumber: 1,
          },
        },
      },
    ]);

    const result = await service.emitBoletoForOrder(
      "order-123",
      "employee-1",
      customerData
    );

    expect(result.alreadyIssued).toBe(true);
    expect(mockCreatePayment).not.toHaveBeenCalled();
    expect(mockGenerateSicrediBoleto).not.toHaveBeenCalled();
  });
});
