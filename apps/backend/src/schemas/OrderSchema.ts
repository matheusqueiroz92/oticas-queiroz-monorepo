import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productType: {
      type: String,
      enum: ["glasses", "lensCleaner"],
      default: "glasses",
      required: true,
    },
    product: { type: String, required: true }, // futura implementação -> [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
    glassesType: {
      type: String,
      enum: ["prescription", "sunglasses"],
      default: "prescription",
      required: true,
    },
    glassesFrame: {
      type: String,
      enum: ["with", "no"],
      default: "with",
      required: true,
    },
    paymentMethod: { type: String, required: true },
    paymentEntry: Number,
    installments: Number,
    deliveryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "in_production", "ready", "delivered", "cancelled"],
      default: "pending",
    },
    // Permitir que o laboratoryId seja nulo ou indefinido
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: "Laboratory",
      required: false, // Explicitamente indicar que não é obrigatório
      default: null, // Valor padrão nulo
    },
    prescriptionData: {
      doctorName: { type: String },
      clinicName: { type: String },
      appointmentDate: { type: Date },
      leftEye: {
        sph: Number,
        cyl: Number,
        axis: Number,
      },
      rightEye: {
        sph: Number,
        cyl: Number,
        axis: Number,
      },
      nd: Number,
      oc: Number,
      addition: Number,
    },
    lensType: String,
    observations: String,
    totalPrice: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Order = model("Order", orderSchema);
