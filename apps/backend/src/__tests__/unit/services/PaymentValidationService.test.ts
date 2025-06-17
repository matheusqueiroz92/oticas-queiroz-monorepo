import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PaymentValidationService, PaymentValidationError } from "../../../services/PaymentValidationService";
import type { CreatePaymentDTO } from "../../../interfaces/IPayment";

// Mock dos repositórios com tipagem simples
const mockOrderRepository = {
  findById: jest.fn(),
} as any;

const mockUserRepository = {
  findById: jest.fn(),
} as any;

const mockLegacyClientRepository = {
  findById: jest.fn(),
} as any;

const mockCashRegisterRepository = {
  findOpenRegister: jest.fn(),
} as any;

// Mock da RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: () => ({
    orderRepository: mockOrderRepository,
    userRepository: mockUserRepository,
    legacyClientRepository: mockLegacyClientRepository,
    cashRegisterRepository: mockCashRegisterRepository,
  }),
}));

describe("PaymentValidationService", () => {
  let paymentValidationService: PaymentValidationService;

  const mockOrder = {
    _id: "order123",
    status: "pending",
    totalPrice: 100,
    clientId: "client123",
  };

  const mockCancelledOrder = {
    _id: "order123",
    status: "cancelled",
    totalPrice: 100,
    clientId: "client123",
  };

  const mockUser = {
    _id: "user123",
    name: "João Silva",
    email: "joao@test.com",
    role: "customer",
  };

  const mockLegacyClient = {
    _id: "legacy123",
    name: "Cliente Legado",
    email: "legacy@test.com",
  };

  const mockCashRegister = {
    _id: "register123",
    isOpen: true,
    openedBy: "employee123",
  };

  beforeEach(() => {
    paymentValidationService = new PaymentValidationService();
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("deve criar instância do serviço corretamente", () => {
      expect(paymentValidationService).toBeInstanceOf(PaymentValidationService);
    });
  });

  describe("PaymentValidationError", () => {
    it("deve criar erro de validação corretamente", () => {
      const error = new PaymentValidationError("Teste de erro");
      expect(error.message).toBe("Teste de erro");
      expect(error.name).toBe("PaymentValidationError");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("validateAmount", () => {
    it("deve validar valor positivo", () => {
      expect(() => {
        paymentValidationService.validateAmount(100);
      }).not.toThrow();
    });

    it("deve falhar se valor for zero", () => {
      expect(() => {
        paymentValidationService.validateAmount(0);
      }).toThrow(new PaymentValidationError("Valor do pagamento deve ser maior que zero"));
    });

    it("deve falhar se valor for negativo", () => {
      expect(() => {
        paymentValidationService.validateAmount(-50);
      }).toThrow(new PaymentValidationError("Valor do pagamento deve ser maior que zero"));
    });
  });

  describe("validateAndGetOpenRegister", () => {
    it("deve retornar ID do caixa aberto", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);

      const result = await paymentValidationService.validateAndGetOpenRegister();
      expect(result).toBe("register123");
      expect(mockCashRegisterRepository.findOpenRegister).toHaveBeenCalled();
    });

    it("deve falhar se não houver caixa aberto", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(null);

      await expect(
        paymentValidationService.validateAndGetOpenRegister()
      ).rejects.toThrow(new PaymentValidationError("Não há caixa aberto no momento"));
    });

    it("deve falhar se caixa aberto não tiver ID", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue({ isOpen: true });

      await expect(
        paymentValidationService.validateAndGetOpenRegister()
      ).rejects.toThrow(new PaymentValidationError("Não há caixa aberto no momento"));
    });
  });

  describe("validateOrder", () => {
    it("deve ignorar validação se orderId não for fornecido", async () => {
      await expect(
        paymentValidationService.validateOrder()
      ).resolves.not.toThrow();
    });

    it("deve ignorar validação se orderId for undefined", async () => {
      await expect(
        paymentValidationService.validateOrder(undefined)
      ).resolves.not.toThrow();
    });

    it("deve validar pedido existente", async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      await expect(
        paymentValidationService.validateOrder("order123")
      ).resolves.not.toThrow();
    });

    it("deve falhar se pedido não existir", async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        paymentValidationService.validateOrder("order123")
      ).rejects.toThrow(new PaymentValidationError("Pedido não encontrado"));
    });

    it("deve falhar se pedido estiver cancelado", async () => {
      mockOrderRepository.findById.mockResolvedValue(mockCancelledOrder);

      await expect(
        paymentValidationService.validateOrder("order123")
      ).rejects.toThrow(new PaymentValidationError("Não é possível registrar pagamento de pedido cancelado"));
    });
  });

  describe("validateCustomer", () => {
    it("deve ignorar validação se customerId não for fornecido", async () => {
      await expect(
        paymentValidationService.validateCustomer()
      ).resolves.not.toThrow();
    });

    it("deve ignorar validação se customerId for undefined", async () => {
      await expect(
        paymentValidationService.validateCustomer(undefined)
      ).resolves.not.toThrow();
    });

    it("deve validar cliente existente", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(
        paymentValidationService.validateCustomer("user123")
      ).resolves.not.toThrow();
    });

    it("deve falhar se cliente não existir", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        paymentValidationService.validateCustomer("user123")
      ).rejects.toThrow(new PaymentValidationError("Cliente não encontrado"));
    });
  });

  describe("validateLegacyClient", () => {
    it("deve ignorar validação se legacyClientId não for fornecido", async () => {
      await expect(
        paymentValidationService.validateLegacyClient()
      ).resolves.not.toThrow();
    });

    it("deve ignorar validação se legacyClientId for undefined", async () => {
      await expect(
        paymentValidationService.validateLegacyClient(undefined)
      ).resolves.not.toThrow();
    });

    it("deve validar cliente legado existente", async () => {
      mockLegacyClientRepository.findById.mockResolvedValue(mockLegacyClient);

      await expect(
        paymentValidationService.validateLegacyClient("legacy123")
      ).resolves.not.toThrow();
    });

    it("deve falhar se cliente legado não existir", async () => {
      mockLegacyClientRepository.findById.mockResolvedValue(null);

      await expect(
        paymentValidationService.validateLegacyClient("legacy123")
      ).rejects.toThrow(new PaymentValidationError("Cliente legado não encontrado"));
    });
  });

  describe("validateInstallments", () => {
    it("deve ignorar validação para métodos não parcelados", () => {
      expect(() => {
        paymentValidationService.validateInstallments("cash");
      }).not.toThrow();
    });

    it("deve validar parcelamento correto", () => {
      expect(() => {
        paymentValidationService.validateInstallments("installment", {
          current: 1,
          total: 3,
          value: 100
        });
      }).not.toThrow();
    });

    it("deve falhar se dados de parcelamento não forem fornecidos", () => {
      expect(() => {
        paymentValidationService.validateInstallments("installment");
      }).toThrow(new PaymentValidationError("Dados de parcelamento são obrigatórios para pagamento parcelado"));
    });

    it("deve falhar se total de parcelas for menor que 2", () => {
      expect(() => {
        paymentValidationService.validateInstallments("installment", {
          current: 1,
          total: 1,
          value: 100
        });
      }).toThrow(new PaymentValidationError("Número de parcelas deve ser maior que 1"));
    });

    it("deve falhar se valor da parcela for zero ou negativo", () => {
      expect(() => {
        paymentValidationService.validateInstallments("installment", {
          current: 1,
          total: 3,
          value: 0
        });
      }).toThrow(new PaymentValidationError("Valor da parcela deve ser maior que zero"));

      expect(() => {
        paymentValidationService.validateInstallments("installment", {
          current: 1,
          total: 3,
          value: -50
        });
      }).toThrow(new PaymentValidationError("Valor da parcela deve ser maior que zero"));
    });

    it("deve falhar se parcela atual for inválida", () => {
      expect(() => {
        paymentValidationService.validateInstallments("installment", {
          current: 0,
          total: 3,
          value: 100
        });
      }).toThrow(new PaymentValidationError("Número da parcela atual deve estar entre 1 e o total de parcelas"));

      expect(() => {
        paymentValidationService.validateInstallments("installment", {
          current: 4,
          total: 3,
          value: 100
        });
      }).toThrow(new PaymentValidationError("Número da parcela atual deve estar entre 1 e o total de parcelas"));
    });
  });

  describe("validateClientDebtData", () => {
    it("deve validar dados corretos de débito", () => {
      const validClientDebt = {
        generateDebt: true,
        installments: { total: 3, value: 100 },
        dueDates: [new Date(), new Date(), new Date()]
      };

      expect(() => {
        paymentValidationService.validateClientDebtData(validClientDebt);
      }).not.toThrow();
    });

    it("deve falhar se dados de parcelamento estiverem ausentes", () => {
      const invalidClientDebt = {
        generateDebt: true,
        dueDates: [new Date(), new Date()]
      };

      expect(() => {
        paymentValidationService.validateClientDebtData(invalidClientDebt as any);
      }).toThrow(new PaymentValidationError("Dados de parcelamento são obrigatórios para débito ao cliente"));
    });

    it("deve falhar se installments não tiver total", () => {
      const invalidClientDebt = {
        generateDebt: true,
        installments: { value: 100 },
        dueDates: [new Date(), new Date()]
      };

      expect(() => {
        paymentValidationService.validateClientDebtData(invalidClientDebt as any);
      }).toThrow(new PaymentValidationError("Dados de parcelamento são obrigatórios para débito ao cliente"));
    });

    it("deve falhar se installments não tiver value", () => {
      const invalidClientDebt = {
        generateDebt: true,
        installments: { total: 2 },
        dueDates: [new Date(), new Date()]
      };

      expect(() => {
        paymentValidationService.validateClientDebtData(invalidClientDebt as any);
      }).toThrow(new PaymentValidationError("Dados de parcelamento são obrigatórios para débito ao cliente"));
    });

    it("deve falhar se datas de vencimento estiverem ausentes", () => {
      const invalidClientDebt = {
        generateDebt: true,
        installments: { total: 2, value: 100 }
      };

      expect(() => {
        paymentValidationService.validateClientDebtData(invalidClientDebt as any);
      }).toThrow(new PaymentValidationError("Datas de vencimento são obrigatórias para débito ao cliente"));
    });

    it("deve falhar se datas de vencimento estiverem vazias", () => {
      const invalidClientDebt = {
        generateDebt: true,
        installments: { total: 2, value: 100 },
        dueDates: []
      };

      expect(() => {
        paymentValidationService.validateClientDebtData(invalidClientDebt);
      }).toThrow(new PaymentValidationError("Datas de vencimento são obrigatórias para débito ao cliente"));
    });

    it("deve falhar se número de datas não coincidir com número de parcelas", () => {
      const invalidClientDebt = {
        generateDebt: true,
        installments: { total: 3, value: 100 },
        dueDates: [new Date(), new Date()] // Só 2 datas para 3 parcelas
      };

      expect(() => {
        paymentValidationService.validateClientDebtData(invalidClientDebt);
      }).toThrow(new PaymentValidationError("O número de datas de vencimento deve ser igual ao número de parcelas"));
    });
  });

  describe("validatePayment", () => {
    const validPaymentData: CreatePaymentDTO = {
      amount: 100,
      paymentMethod: "cash",
      status: "completed",
      type: "sale",
      createdBy: "employee123",
      cashRegisterId: "register123",
      date: new Date()
    };

    beforeEach(() => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockLegacyClientRepository.findById.mockResolvedValue(mockLegacyClient);
    });

    it("deve validar pagamento básico", async () => {
      const result = await paymentValidationService.validatePayment(validPaymentData);
      expect(result).toBe("register123");
    });

    it("deve validar pagamento com pedido", async () => {
      const paymentWithOrder = { ...validPaymentData, orderId: "order123" };
      
      const result = await paymentValidationService.validatePayment(paymentWithOrder);
      expect(result).toBe("register123");
      expect(mockOrderRepository.findById).toHaveBeenCalledWith("order123");
    });

    it("deve validar pagamento com cliente", async () => {
      const paymentWithCustomer = { ...validPaymentData, customerId: "user123" };
      
      const result = await paymentValidationService.validatePayment(paymentWithCustomer);
      expect(result).toBe("register123");
      expect(mockUserRepository.findById).toHaveBeenCalledWith("user123");
    });

    it("deve validar pagamento com cliente legado", async () => {
      const paymentWithLegacyClient = { ...validPaymentData, legacyClientId: "legacy123" };
      
      const result = await paymentValidationService.validatePayment(paymentWithLegacyClient);
      expect(result).toBe("register123");
      expect(mockLegacyClientRepository.findById).toHaveBeenCalledWith("legacy123");
    });

    it("deve validar pagamento com parcelamento", async () => {
      const paymentWithInstallments = {
        ...validPaymentData,
        creditCardInstallments: {
          current: 1,
          total: 3,
          value: 100
        }
      };
      
      const result = await paymentValidationService.validatePayment(paymentWithInstallments);
      expect(result).toBe("register123");
    });

    it("deve validar pagamento com débito ao cliente", async () => {
      const paymentWithClientDebt = {
        ...validPaymentData,
        clientDebt: {
          generateDebt: true,
          installments: { total: 2, value: 50 },
          dueDates: [new Date(), new Date()]
        }
      };
      
      const result = await paymentValidationService.validatePayment(paymentWithClientDebt);
      expect(result).toBe("register123");
    });

    it("deve falhar se valor for inválido", async () => {
      const invalidPayment = { ...validPaymentData, amount: 0 };
      
      await expect(
        paymentValidationService.validatePayment(invalidPayment)
      ).rejects.toThrow(new PaymentValidationError("Valor do pagamento deve ser maior que zero"));
    });

    it("deve falhar se não houver caixa aberto", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(null);
      
      await expect(
        paymentValidationService.validatePayment(validPaymentData)
      ).rejects.toThrow(new PaymentValidationError("Não há caixa aberto no momento"));
    });
  });

  describe("isInstallmentPaymentMethod", () => {
    it("deve identificar métodos de pagamento parcelado", () => {
      expect(paymentValidationService.isInstallmentPaymentMethod("credit")).toBe(true);
      expect(paymentValidationService.isInstallmentPaymentMethod("installment")).toBe(true);
    });

    it("deve identificar métodos de pagamento não parcelado", () => {
      expect(paymentValidationService.isInstallmentPaymentMethod("cash")).toBe(false);
      expect(paymentValidationService.isInstallmentPaymentMethod("debit")).toBe(false);
      expect(paymentValidationService.isInstallmentPaymentMethod("pix")).toBe(false);
    });
  });

  describe("normalizePaymentMethod", () => {
    it("deve normalizar métodos de pagamento conhecidos", () => {
      expect(paymentValidationService.normalizePaymentMethod("cartao_credito")).toBe("credit");
      expect(paymentValidationService.normalizePaymentMethod("cartao_debito")).toBe("debit");
      expect(paymentValidationService.normalizePaymentMethod("dinheiro")).toBe("cash");
      expect(paymentValidationService.normalizePaymentMethod("boleto")).toBe("bank_slip");
      expect(paymentValidationService.normalizePaymentMethod("promissoria")).toBe("promissory_note");
      expect(paymentValidationService.normalizePaymentMethod("cheque")).toBe("check");
    });

    it("deve retornar método original se não for conhecido", () => {
      expect(paymentValidationService.normalizePaymentMethod("unknown_method")).toBe("unknown_method");
      expect(paymentValidationService.normalizePaymentMethod("CASH")).toBe("CASH");
      expect(paymentValidationService.normalizePaymentMethod("mercado_pago")).toBe("mercado_pago");
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve propagar erros do repositório de pedidos", async () => {
      const error = new Error("Database error");
      mockOrderRepository.findById.mockRejectedValue(error);

      await expect(
        paymentValidationService.validateOrder("order123")
      ).rejects.toThrow("Database error");
    });

    it("deve propagar erros do repositório de usuários", async () => {
      const error = new Error("User database error");
      mockUserRepository.findById.mockRejectedValue(error);

      await expect(
        paymentValidationService.validateCustomer("user123")
      ).rejects.toThrow("User database error");
    });

    it("deve propagar erros do repositório de clientes legados", async () => {
      const error = new Error("Legacy client database error");
      mockLegacyClientRepository.findById.mockRejectedValue(error);

      await expect(
        paymentValidationService.validateLegacyClient("legacy123")
      ).rejects.toThrow("Legacy client database error");
    });

    it("deve propagar erros do repositório de caixa", async () => {
      const error = new Error("Cash register database error");
      mockCashRegisterRepository.findOpenRegister.mockRejectedValue(error);

      await expect(
        paymentValidationService.validateAndGetOpenRegister()
      ).rejects.toThrow("Cash register database error");
    });
  });

  describe("Edge Cases", () => {
    it("deve lidar com parcelamento sem current definido", async () => {
      const paymentData: CreatePaymentDTO = {
        amount: 100,
        paymentMethod: "cash",
        status: "completed",
        type: "sale",
        createdBy: "employee123",
        cashRegisterId: "register123",
        date: new Date(),
        creditCardInstallments: {
          total: 3,
          value: 100
          // current não definido
        }
      };

      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);

      const result = await paymentValidationService.validatePayment(paymentData);
      expect(result).toBe("register123");
    });

    it("deve lidar com parcelamento sem value definido", async () => {
      const paymentData: CreatePaymentDTO = {
        amount: 100,
        paymentMethod: "cash",
        status: "completed",
        type: "sale",
        createdBy: "employee123",
        cashRegisterId: "register123",
        date: new Date(),
        creditCardInstallments: {
          current: 1,
          total: 3
          // value não definido
        }
      };

      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);

      const result = await paymentValidationService.validatePayment(paymentData);
      expect(result).toBe("register123");
    });

    it("deve lidar com clientDebt sem generateDebt", async () => {
      const paymentData: CreatePaymentDTO = {
        amount: 100,
        paymentMethod: "cash",
        status: "completed",
        type: "sale",
        createdBy: "employee123",
        cashRegisterId: "register123",
        date: new Date(),
        clientDebt: {
          generateDebt: false,
          installments: { total: 2, value: 50 },
          dueDates: [new Date(), new Date()]
        }
      };

      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);

      const result = await paymentValidationService.validatePayment(paymentData);
      expect(result).toBe("register123");
    });
  });
});
