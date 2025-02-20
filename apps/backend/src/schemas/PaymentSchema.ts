import { Schema, model } from "mongoose";
import type { IPayment } from "../interfaces/IPayment";

const paymentSchema = new Schema(
  {
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
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    legacyClientId: { type: Schema.Types.ObjectId, ref: "LegacyClient" },
    categoryId: { type: Schema.Types.ObjectId, ref: "FinancialCategory" },
    cashRegisterId: {
      type: Schema.Types.ObjectId,
      ref: "CashRegister",
      required: true,
    },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Payment = model("Payment", paymentSchema);
