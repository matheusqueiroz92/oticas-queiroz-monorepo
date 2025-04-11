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