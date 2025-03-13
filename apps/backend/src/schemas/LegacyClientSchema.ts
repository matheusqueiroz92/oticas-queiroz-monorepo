import { model, Schema } from "mongoose";

const legacyClientSchema = new Schema(
  {
    name: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    email: { type: String },
    phone: { type: String },
    address: {
      street: String,
      number: String,
      complement: String,
      neighborhood: String,
      city: String,
      state: String,
      zipCode: String,
    },
    totalDebt: { type: Number, default: 0 },
    lastPayment: {
      date: Date,
      amount: Number,
    },
    paymentHistory: [
      {
        date: { type: Date },
        amount: { type: Number },
        paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    observations: { type: String },
  },
  { timestamps: true }
);

export const LegacyClient = model("LegacyClient", legacyClientSchema);
