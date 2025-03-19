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
    // Agora é um array de produtos
    product: [{
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    }],
    paymentMethod: { 
      type: String, 
      required: true 
    },
    paymentEntry: Number,
    installments: Number,
    orderDate: { 
      type: Date, 
      required: true,
      default: Date.now
    },
    deliveryDate: { 
      type: Date 
    },
    status: {
      type: String,
      enum: ["pending", "in_production", "ready", "delivered", "cancelled"],
      default: "pending",
      required: true
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
      rightEye: {
        sph: Number,
        cyl: Number,
        axis: Number,
        pd: Number,
      },
      leftEye: {
        sph: Number,
        cyl: Number,
        axis: Number,
        pd: Number,
      },
      nd: Number,
      oc: Number,
      addition: Number,
    },
    observations: String,
    totalPrice: { 
      type: Number, 
      required: true 
    },
    discount: {
      type: Number,
      default: 0,
      required: true
    },
    finalPrice: {
      type: Number,
      default: 0,
      required: true,
    },
    // Campos para soft delete
    isDeleted: { 
      type: Boolean, 
      default: false 
    },
    deletedAt: Date,
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Middleware para calcular o preço final se não for fornecido
orderSchema.pre("validate", function(next) {
  if (!this.finalPrice) {
    this.finalPrice = this.totalPrice - this.discount;
  }
  
  // Verificar se há pelo menos um produto no pedido
  if (!this.product || this.product.length === 0) {
    this.invalidate("product", "Pelo menos um produto deve ser adicionado ao pedido");
  }

  // Validar que finalPrice é positivo
  if (this.finalPrice < 0) {
    this.invalidate("finalPrice", "O preço final não pode ser negativo");
  }

  // Validar que discount não é maior que totalPrice
  if (this.discount > this.totalPrice) {
    this.invalidate("discount", "O desconto não pode ser maior que o preço total");
  }

  next();
});

export const Order = model("Order", orderSchema);