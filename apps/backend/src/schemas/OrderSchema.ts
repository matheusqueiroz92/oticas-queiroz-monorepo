import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
    description: String,
    paymentMethod: { type: String, required: true },
    paymentEntry: Number,
    installments: Number,
    deliveryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "in_production", "ready", "delivered"],
      default: "pending",
    },
    laboratoryId: { type: Schema.Types.ObjectId, ref: "Laboratory" },
    prescriptionData: {
      doctorName: { type: String, required: true },
      clinicName: { type: String, required: true },
      appointmentdate: { type: Date, required: true },
      leftEye: {
        near: {
          sph: Number,
          cyl: Number,
          axis: Number,
          pd: Number,
        },
        far: {
          sph: Number,
          cyl: Number,
          axis: Number,
          pd: Number,
        },
      },
      rightEye: {
        near: {
          sph: Number,
          cyl: Number,
          axis: Number,
          pd: Number,
        },
        far: {
          sph: Number,
          cyl: Number,
          axis: Number,
          pd: Number,
        },
      },
    },
    totalPrice: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Order = model("Order", orderSchema);
