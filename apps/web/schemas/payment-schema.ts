import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const paymentFormSchema = z.object({
  amount: z.preprocess(
    (value) =>
      value === ""
        ? 0
        : Number.parseFloat(String(value).replace(",", ".")),
    z.number().positive("O valor deve ser positivo")
  ),
  type: z.enum(["sale", "debt_payment", "expense"] as const, {
    required_error: "Selecione o tipo de pagamento",
  }),
  paymentMethod: z.enum([
    "credit",
    "debit",
    "cash",
    "pix",
    "check",
    "bank_slip",
    "promissory_note",
    "mercado_pago",
    "sicredi_boleto"
  ] as const, {
    required_error: "Selecione o método de pagamento",
  }),
  check: z.object({
    bank: z.string().min(1, "Banco é obrigatório").optional(),
    checkNumber: z.string().min(1, "Número do cheque é obrigatório").optional(),
    checkDate: z.date().optional(),
    accountHolder: z.string().min(2, "Nome do titular é obrigatório").optional(),
    branch: z.string().min(1, "Agência é obrigatória").optional(),
    accountNumber: z.string().min(1, "Número da conta é obrigatório").optional(),
    presentationDate: z.date().optional(),
    compensationStatus: z.enum(["pending", "compensated", "rejected"]).default("pending").optional(),
    rejectionReason: z.string().optional()
  }).optional(),
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
  status: z.enum(["pending", "completed", "cancelled"] as const, {
    required_error: "Selecione o status",
  }),
}).refine((data) => {
  // Se o método for cheque, validar os campos obrigatórios
  if (data.paymentMethod === "check") {
    return !!(
      data.check?.bank &&
      data.check?.checkNumber &&
      data.check?.checkDate &&
      data.check?.accountHolder &&
      data.check?.branch &&
      data.check?.accountNumber
    );
  }
  return true;
}, {
  message: "Todos os dados do cheque são obrigatórios",
  path: ["check"]
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export const createPaymentform = () => {
  return useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      type: "sale",
      paymentMethod: "cash",
      paymentDate: new Date(),
      description: "",
      category: "",
      installments: 1,
      status: "completed",
    },
  });
}