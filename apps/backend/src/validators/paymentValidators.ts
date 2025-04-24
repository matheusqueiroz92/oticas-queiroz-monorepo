import { z } from "zod";

const creditCardSchema = z.object({
  creditCardInstallments: z
    .object({
      total: z.number().min(1).default(1),
      value: z.number().positive().optional(),
    })
    .optional(),
});

const bankSlipSchema = z.object({
  bank_slip: z.object({
    code: z.string().min(1, "Código do boleto é obrigatório"),
    bank: z.string().min(1, "Banco é obrigatório"),
  }),
  clientDebt: z
    .object({
      generateDebt: z.boolean().default(false),
      installments: z
        .object({
          total: z.number().min(1),
          value: z.number().positive(),
        })
        .optional(),
      dueDates: z.array(z.date()).optional(),
    })
    .optional(),
});

const promissoryNoteSchema = z.object({
  promissoryNote: z.object({
    number: z.string().min(1, "Número da promissória é obrigatório"),
  }),
  clientDebt: z
    .object({
      generateDebt: z.boolean().default(false),
      installments: z
        .object({
          total: z.number().min(1),
          value: z.number().positive(),
        })
        .optional(),
      dueDates: z.array(z.date()).optional(),
    })
    .optional(),
});

const checkSchema = z.object({
  check: z.object({
    bank: z.string().min(1, "Banco é obrigatório"),
    checkNumber: z.string().min(1, "O número do cheque é obrigatório"),
    checkDate: z.coerce.date(),
    accountHolder: z.string().min(2, "Nome do titular da conta é obrigatório"),
    branch: z.string().min(1, "Agência bancária é obrigatória"),
    accountNumber: z.string().min(1, "Número da conta é obrigatório"),
    presentationDate: z.coerce.date().optional(),
    compensationStatus: z.enum(["pending", "compensated", "rejected"]).default("pending"),
    rejectionReason: z.string().optional()
  }),
  clientDebt: z
    .object({
      generateDebt: z.boolean().default(false),
      installments: z
        .object({
          total: z.number().min(1),
          value: z.number().positive(),
        })
        .optional(),
      dueDates: z.array(z.date()).optional(),
    })
    .optional(),
})

// Esquema base do pagamento
const basePaymentSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  type: z.enum(["sale", "debt_payment", "expense"] as const, {
    errorMap: () => ({ message: "Tipo de pagamento inválido" }),
  }),
  paymentMethod: z.enum(
    ["credit", "debit", "cash", "pix", "bank_slip", "promissory_note", "check"] as const,
    {
      errorMap: () => ({ message: "Método de pagamento inválido" }),
    }
  ),
  orderId: z.string().optional(),
  customerId: z.string().optional(),
  institutionId: z.string().optional(),
  isInstitutionalPayment: z.boolean().default(false),
  legacyClientId: z.string().optional(),
  description: z.string().optional(),
});

// Schema condicional
const paymentSchema = z.discriminatedUnion("paymentMethod", [
  // Cartão de crédito
  basePaymentSchema
    .extend({
      paymentMethod: z.literal("credit"),
    })
    .merge(creditCardSchema),

  // Cartão de débito
  basePaymentSchema.extend({
    paymentMethod: z.literal("debit"),
  }),

  // Dinheiro
  basePaymentSchema.extend({
    paymentMethod: z.literal("cash"),
  }),

  // PIX
  basePaymentSchema.extend({
    paymentMethod: z.literal("pix"),
  }),

  // Boleto
  basePaymentSchema
    .extend({
      paymentMethod: z.literal("bank_slip"),
    })
    .merge(bankSlipSchema),

  // Promissória
  basePaymentSchema
    .extend({
      paymentMethod: z.literal("promissory_note"),
    })
    .merge(promissoryNoteSchema),
  
  // Cheque
  basePaymentSchema
  .extend({
    paymentMethod: z.literal("check"),
  })
  .merge(checkSchema),
]);

export const validatedPaymentSchema = paymentSchema.refine(
  (data) => {
    if (data.isInstitutionalPayment === true && !data.institutionId) {
      return false;
    }
    return true;
  },
  {
    message: "Para pagamentos institucionais, o ID da instituição é obrigatório",
    path: ["institutionId"],
  }
);