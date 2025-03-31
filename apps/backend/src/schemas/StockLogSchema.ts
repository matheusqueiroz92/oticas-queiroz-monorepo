import mongoose, { Schema, Document } from 'mongoose';

export interface IStockLog {
  _id?: string;
  productId: mongoose.Types.ObjectId | string;
  orderId?: mongoose.Types.ObjectId | string;
  previousStock: number;
  newStock: number;
  quantity: number;
  operation: 'increase' | 'decrease';
  reason: string;
  performedBy: mongoose.Types.ObjectId | string;
  createdAt?: Date;
}

interface StockLogDocument extends Document, Omit<IStockLog, '_id'> {}

const stockLogSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  operation: {
    type: String,
    enum: ['increase', 'decrease'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const StockLog = mongoose.model<StockLogDocument>('StockLog', stockLogSchema);

export { StockLog };