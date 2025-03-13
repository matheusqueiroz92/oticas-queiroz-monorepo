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
    product: { type: String, required: true },
    // Campos para óculos
    glassesType: {
      type: String,
      enum: ["prescription", "sunglasses"],
      // Não definimos required aqui
    },
    glassesFrame: {
      type: String,
      enum: ["with", "no"],
      // Não definimos required aqui
    },
    paymentMethod: { type: String, required: true },
    paymentEntry: Number,
    installments: Number,
    orderDate: { type: Date, required: true },
    deliveryDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "in_production", "ready", "delivered", "cancelled"],
      default: "pending",
    },
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: "Laboratory",
      required: false,
      default: null,
    },
    // Dados de prescrição
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
    lensType: { type: String },
    observations: String,
    totalPrice: { type: Number, required: true },
    // Campos para soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Validação pré-salvamento para garantir que campos de óculos estejam presentes quando necessário
orderSchema.pre("validate", function (next) {
  if (this.productType === "glasses") {
    if (!this.glassesType) {
      this.invalidate(
        "glassesType",
        'Tipo de óculos é obrigatório para produtos do tipo "glasses"'
      );
    }

    if (!this.glassesFrame) {
      this.invalidate(
        "glassesFrame",
        'Informação sobre armação é obrigatória para produtos do tipo "glasses"'
      );
    }

    if (!this.lensType) {
      this.invalidate(
        "lensType",
        'Tipo de lente é obrigatório para produtos do tipo "glasses"'
      );
    }

    if (this.glassesType === "prescription") {
      if (!this.prescriptionData || !this.prescriptionData.doctorName) {
        this.invalidate(
          "prescriptionData",
          "Dados de prescrição são obrigatórios para óculos de grau"
        );
      }
    }
  }
  next();
});

export const Order = model("Order", orderSchema);
