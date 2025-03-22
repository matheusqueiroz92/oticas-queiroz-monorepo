import { z } from "zod";

export const paymentFormSchema = z.object({
  amount: z.preprocess(
    (value) =>
      value === ""
        ? 0 // Retorna 0 se o valor for uma string vazia
        : Number.parseFloat(String(value).replace(",", ".")),
    z.number().positive("O valor deve ser positivo")
  ),
  type: z.enum(["sale", "debt_payment", "expense"] as const, {
    required_error: "Selecione o tipo de pagamento",
  }),
  paymentMethod: z.enum(["credit", "debit", "cash", "pix", "check"] as const, {
    required_error: "Selecione o método de pagamento",
  }),
  paymentDate: z.date({
    required_error: "Selecione a data do pagamento",
  }),
  description: z.string().optional(),
  category: z.string().optional(),
  cashRegisterId: z.string({
    required_error: "Selecione o caixa",
  }),
  customerId: z.string().optional(),
  legacyClientId: z.string().optional(),
  orderId: z.string().optional(),
  installments: z.preprocess(
    (value) => (value === "" ? undefined : Number.parseInt(String(value), 10)),
    z.number().min(1, "Número mínimo de parcelas é 1").optional()
  ),
  status: z.enum(["pending", "completed"] as const, {
    required_error: "Selecione o status",
  }),
});