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
    required: true,
    index: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    index: true
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
    required: true,
    index: true
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
}, { 
  timestamps: true,
  // Adicionando índices compostos para otimizar consultas
  indexes: [
    { productId: 1, createdAt: -1 },
    { orderId: 1, operation: 1 }
  ]
});

// Método para buscar histórico de estoque de um produto
stockLogSchema.statics.getProductStockHistory = async function(productId: string) {
  return this.find({ productId: new mongoose.Types.ObjectId(productId) })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name')
    .populate('orderId')
    .exec();
};

// Método para buscar movimentações de estoque de um pedido
stockLogSchema.statics.getOrderStockMovements = async function(orderId: string) {
  return this.find({ orderId: new mongoose.Types.ObjectId(orderId) })
    .sort({ createdAt: -1 })
    .populate('productId', 'name productType')
    .populate('performedBy', 'name')
    .exec();
};

const StockLog = mongoose.model<StockLogDocument>('StockLog', stockLogSchema);

export { StockLog };