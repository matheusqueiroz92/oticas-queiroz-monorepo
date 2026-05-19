import { describe, it, expect } from "@jest/globals";
import {
  formatDebtsResultMessage,
  formatOrderResultMessage,
} from "../../../utils/botMessageFormatters";

describe("botMessageFormatters", () => {
  it("formats order summary for WhatsApp", () => {
    const text = formatOrderResultMessage({
      serviceOrder: "300001",
      status: "ready",
      paymentStatus: "partially_paid",
      orderDate: "2025-01-15T14:30:00.000Z",
      deliveryDate: null,
      totalPrice: 899.9,
      totalPaid: 300,
      remainingAmount: 599.9,
    });

    expect(text).toContain("300001");
    expect(text).toContain("Pronto para retirada");
    expect(text).toContain("R$");
  });

  it("formats empty debts message", () => {
    const text = formatDebtsResultMessage({
      cpf: "12345678901",
      totalDebt: 0,
      pendingDebts: [],
    });

    expect(text).toContain("Não há débitos");
  });

  it("formats debts with pending items", () => {
    const text = formatDebtsResultMessage({
      cpf: "12345678901",
      totalDebt: 100,
      pendingDebts: [
        {
          orderId: "o1",
          serviceOrder: "99",
          status: "pending",
          totalPrice: 100,
          totalPaid: 0,
          remainingAmount: 100,
        },
      ],
    });

    expect(text).toContain("O.S. 99");
    expect(text).toContain("R$");
  });
});
