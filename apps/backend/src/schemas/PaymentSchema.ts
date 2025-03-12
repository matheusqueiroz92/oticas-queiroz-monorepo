import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
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
    paymentMethod: {
      type: String,
      enum: ["credit", "debit", "cash", "pix", "installment"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    installments: {
      current: { type: Number },
      total: { type: Number },
      value: { type: Number },
    },
    description: { type: String },
    // Campos de soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Adicionar um índice para consultas mais rápidas, excluindo documentos excluídos por padrão
paymentSchema.index({ isDeleted: 1 });

export const Payment = model("Payment", paymentSchema);
