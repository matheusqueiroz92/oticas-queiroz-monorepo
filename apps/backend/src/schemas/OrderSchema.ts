import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
    status: {
      type: String,
      enum: ["pending", "in_production", "ready", "delivered"],
      default: "pending",
    },
    laboratoryId: { type: Schema.Types.ObjectId, ref: "Laboratory" },
    totalPrice: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Order = model("Order", orderSchema);
