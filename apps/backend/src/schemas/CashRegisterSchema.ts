import { Schema, model } from "mongoose";

const cashRegisterSchema = new Schema(
  {
    openingDate: { type: Date, required: true },
    closingDate: { type: Date },
    openingBalance: { type: Number, required: true },
    currentBalance: { type: Number, required: true },
    closingBalance: { type: Number },
    status: {
      type: String,
      enum: ["open", "closed"],
      required: true,
      default: "open",
    },
    sales: {
      total: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
      debit: { type: Number, default: 0 },
      pix: { type: Number, default: 0 },
    },
    payments: {
      received: { type: Number, default: 0 },
      made: { type: Number, default: 0 },
    },
    openedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    closedBy: { type: Schema.Types.ObjectId, ref: "User" },
    observations: { type: String },
  },
  { timestamps: true }
);

export const CashRegister = model("CashRegister", cashRegisterSchema);
