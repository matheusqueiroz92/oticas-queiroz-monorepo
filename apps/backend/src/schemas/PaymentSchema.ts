import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    institutionId: { type: Schema.Types.ObjectId, ref: "User" },
    isInstitutionalPayment: { type: Boolean, default: false },
    legacyClientId: { type: Schema.Types.ObjectId, ref: "LegacyClient" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    cashRegisterId: {
      type: Schema.Types.ObjectId,
      ref: "CashRegister",
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ["sale", "debt_payment", "expense"],
      required: true,
    },
    // Método de pagamento
    paymentMethod: {
      type: String,
      enum: ["credit", "debit", "cash", "pix", "bank_slip", "promissory_note", "check"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    // Informações sobre parcelamento (aplicável apenas para cartão de crédito)
    creditCardInstallments: {
      current: { type: Number },
      total: { type: Number, default: 1 },
      value: { type: Number },
    },
    // Informações sobre débito ao cliente (aplicável para boleto ou promissória)
    clientDebt: {
      // Se true, este pagamento gera débito no cadastro do cliente
      generateDebt: { type: Boolean, default: false },
      // Parcelamento do débito
      installments: {
        total: { type: Number },
        value: { type: Number },
      },
      // Datas de vencimento das parcelas
      dueDates: [{ type: Date }],
    },
    // Campos específicos para boleto
    bank_slip: {
      code: { type: String },
      bank: { type: String },
    },
    // Campos específicos para promissória
    promissoryNote: {
      number: { type: String },
    },
    // Campos específicos para cheque
    check: {
      bank: { type: String },
      checkNumber: { type: String },
      checkDate: { type: Date },
      accountHolder: { type: String },
      branch: { type: String },
      accountNumber: { type: String },
      presentationDate: { type: Date },
      compensationStatus: { 
        type: String, 
        enum: ["pending", "compensated", "rejected"],
        default: "pending",
      },
      rejectionReason: { type: String }
    },
    description: { type: String },
    // Campos de soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Validação pré-salvamento
paymentSchema.pre("validate", function (next) {
  // Se o método for boleto, os dados do boleto devem estar presentes
  if (this.paymentMethod === "bank_slip") {
    if (!this.bank_slip || !this.bank_slip.code) {
      this.invalidate(
        "boleto",
        "Dados do boleto são obrigatórios para pagamento via boleto"
      );
    }

    // Se gerar débito, os dados de parcelamento devem estar presentes
    if (this.clientDebt?.generateDebt) {
      if (
        !this.clientDebt.installments ||
        !this.clientDebt.installments.total ||
        !this.clientDebt.installments.value
      ) {
        this.invalidate(
          "clientDebt.installments",
          "Dados de parcelamento são obrigatórios para débito ao cliente"
        );
      }

      if (!this.clientDebt.dueDates || this.clientDebt.dueDates.length === 0) {
        this.invalidate(
          "clientDebt.dueDates",
          "Datas de vencimento são obrigatórias para débito ao cliente"
        );
      }
    }
  }

  // Se o método for promissória, os dados da promissória devem estar presentes
  if (this.paymentMethod === "promissory_note") {
    if (!this.promissoryNote || !this.promissoryNote.number) {
      this.invalidate(
        "promissoryNote",
        "Dados da promissória são obrigatórios para pagamento via promissória"
      );
    }

    // Se gerar débito, os dados de parcelamento devem estar presentes
    if (this.clientDebt?.generateDebt) {
      if (
        !this.clientDebt.installments ||
        !this.clientDebt.installments.total ||
        !this.clientDebt.installments.value
      ) {
        this.invalidate(
          "clientDebt.installments",
          "Dados de parcelamento são obrigatórios para débito ao cliente"
        );
      }

      if (!this.clientDebt.dueDates || this.clientDebt.dueDates.length === 0) {
        this.invalidate(
          "clientDebt.dueDates",
          "Datas de vencimento são obrigatórias para débito ao cliente"
        );
      }
    }
  }

    // Se o método for cheque, os dados do cheque devem estar presentes
    if (this.paymentMethod === "check") {
      if (!this.check?.bank || !this.check.checkNumber) {
        this.invalidate(
          "check",
          "Dados do cheque são obrigatórios para pagamento via cheque"
        );
      }
  
      // Se gerar débito, os dados de parcelamento devem estar presentes
      if (this.clientDebt?.generateDebt) {
        if (
          !this.clientDebt.installments ||
          !this.clientDebt.installments.total ||
          !this.clientDebt.installments.value
        ) {
          this.invalidate(
            "clientDebt.installments",
            "Dados de parcelamento são obrigatórios para débito ao cliente"
          );
        }
  
        if (!this.clientDebt.dueDates || this.clientDebt.dueDates.length === 0) {
          this.invalidate(
            "clientDebt.dueDates",
            "Datas de vencimento são obrigatórias para débito ao cliente"
          );
        }
      }
    }  

  // Se o método for cartão de crédito e tiver parcelamento
  if (
    this.paymentMethod === "credit" &&
    this.creditCardInstallments &&
    this.creditCardInstallments.total > 1
  ) {
    if (!this.creditCardInstallments.value) {
      this.invalidate(
        "creditCardInstallments",
        "Valor das parcelas é obrigatório para pagamento parcelado no cartão"
      );
    }
  }

  next();
});

// Adicionar índice para consultas mais rápidas, excluindo documentos excluídos por padrão
paymentSchema.index({ isDeleted: 1 });

export const Payment = model("Payment", paymentSchema);
