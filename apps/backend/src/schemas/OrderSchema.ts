import mongoose, { Document, Schema, Model } from 'mongoose';
import { IOrder } from '../interfaces/IOrder';

const orderSchema = new Schema<IOrder>({
  clientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  employeeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }],
  serviceOrder: {
    type: Number,
  },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ["credit", "debit", "cash", "pix", "installment"],
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
    default: null,
  },
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
  observations: {
    type: String,
  },
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
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  deletedAt: Date,
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

orderSchema.pre("validate", function(next) {
  if (!this.finalPrice) {
    this.finalPrice = this.totalPrice - this.discount;
  }

  if (!this.products || this.products.length === 0) {
    this.invalidate("products", "Pelo menos um produto deve ser adicionado ao pedido");
  }

  if (this.finalPrice < 0) {
    this.invalidate("finalPrice", "O preço final não pode ser negativo");
  }

  if (this.discount > this.totalPrice) {
    this.invalidate("discount", "O desconto não pode ser maior que o preço total");
  }

  next();
});

const Order = mongoose.model<IOrder>('Order', orderSchema);

export { Order };