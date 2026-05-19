import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetBotCustomerDebtsByCpfUseCase } from "../../../useCases/bot/GetBotCustomerDebtsByCpfUseCase";
import type { UserService } from "../../../services/UserService";
import type { ClientDebtQueryService } from "../../../services/ClientDebtQueryService";
import { NotFoundError, ValidationError } from "../../../utils/AppError";
import { ErrorCode } from "../../../utils/errorCodes";

describe("GetBotCustomerDebtsByCpfUseCase", () => {
  let useCase: GetBotCustomerDebtsByCpfUseCase;
  let mockUserSvc: jest.Mocked<Pick<UserService, "getUserByCpf">>;
  let mockDebtSvc: jest.Mocked<
    Pick<ClientDebtQueryService, "getClientDebtsData">
  >;

  beforeEach(() => {
    mockUserSvc = { getUserByCpf: jest.fn() };
    mockDebtSvc = { getClientDebtsData: jest.fn() };
    useCase = new GetBotCustomerDebtsByCpfUseCase(
      mockUserSvc as unknown as UserService,
      mockDebtSvc as unknown as ClientDebtQueryService
    );
  });

  it("propagates ValidationError from UserService", async () => {
    mockUserSvc.getUserByCpf.mockRejectedValue(
      new ValidationError("CPF inválido", ErrorCode.INVALID_CPF)
    );
    await expect(useCase.execute("123")).rejects.toMatchObject({
      code: ErrorCode.INVALID_CPF,
    });
  });

  it("maps NotFoundError to friendly customer message", async () => {
    mockUserSvc.getUserByCpf.mockRejectedValue(
      new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND)
    );
    await expect(useCase.execute("12345678901")).rejects.toMatchObject({
      message: "Não encontramos um cliente cadastrado com este CPF.",
      code: ErrorCode.USER_NOT_FOUND,
    });
  });

  it("returns 404 message when user is not customer", async () => {
    mockUserSvc.getUserByCpf.mockResolvedValue({
      _id: "u1",
      role: "employee",
    } as never);
    await expect(useCase.execute("12345678901")).rejects.toMatchObject({
      message: "Não encontramos um cliente cadastrado com este CPF.",
    });
  });

  it("returns bot DTO for customer with debts", async () => {
    mockUserSvc.getUserByCpf.mockResolvedValue({
      _id: "user-id-1",
      role: "customer",
    } as never);
    mockDebtSvc.getClientDebtsData.mockResolvedValue({
      totalDebt: 10,
      paymentHistory: [],
      orders: [
        {
          _id: "o1",
          serviceOrder: "99",
          createdAt: new Date(),
          status: "pending",
          finalPrice: 50,
          paymentEntry: 40,
        },
      ],
    });

    const r = await useCase.execute("123.456.789-01");
    expect(mockUserSvc.getUserByCpf).toHaveBeenCalledWith("12345678901");
    expect(mockDebtSvc.getClientDebtsData).toHaveBeenCalledWith("user-id-1");
    expect(r.cpf).toBe("12345678901");
    expect(r.totalDebt).toBe(10);
    expect(r.pendingDebts).toHaveLength(1);
  });

  it("uses String(_id) when _id is not a string", async () => {
    mockUserSvc.getUserByCpf.mockResolvedValue({
      _id: { toString: () => "oid-99" },
      role: "customer",
    } as never);
    mockDebtSvc.getClientDebtsData.mockResolvedValue({
      totalDebt: 0,
      paymentHistory: [],
      orders: [],
    });

    await useCase.execute("12345678901");
    expect(mockDebtSvc.getClientDebtsData).toHaveBeenCalledWith("oid-99");
  });
});
