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
    type: Schema.Types.Mixed, // Usando Mixed para permitir referencias e objetos embutidos
    required: true
  }],
  serviceOrder: {
    type: String,
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

// Middleware para validar e preparar dados antes de salvar
orderSchema.pre("validate", function(next) {
  // Calcular preço final se não estiver definido
  if (!this.finalPrice) {
    this.finalPrice = this.totalPrice - this.discount;
  }

  // Verificar se há produtos
  if (!this.products || this.products.length === 0) {
    this.invalidate("products", "Pelo menos um produto deve ser adicionado ao pedido");
  }

  // Verificar se o preço final é válido
  if (this.finalPrice < 0) {
    this.invalidate("finalPrice", "O preço final não pode ser negativo");
  }

  // Verificar se o desconto é válido
  if (this.discount > this.totalPrice) {
    this.invalidate("discount", "O desconto não pode ser maior que o preço total");
  }

  next();
});

// Middleware antes de salvar para processar produtos
orderSchema.pre('save', function(next) {
  // Se produtos estiverem embutidos como objetos, garantir que os campos sejam do tipo correto
  if (Array.isArray(this.products)) {
    this.products = this.products.map(product => {
      // Verificar se não é um ObjectId ou string
      if (product === null || typeof product !== 'object') {
        return product; // Retornar como está se for uma string ou null
      }

      // Verificar se é um ObjectId do Mongoose
      if ('_bsontype' in product || mongoose.isValidObjectId(product)) {
        return product; // Retornar como está se for um ObjectId
      }

      // Se chegou aqui, sabemos que é um objeto que não é um ObjectId
      // Agora é seguro acessar propriedades
      
      // Verificar se o objeto tem a propriedade productType
      const productObj = product as any; // Usar any para contornar problemas de tipagem
      
      if (productObj.productType && 
          ['prescription_frame', 'sunglasses_frame'].includes(productObj.productType)) {
        // Garantir que stock seja um número
        if ('stock' in productObj && productObj.stock !== undefined) {
          productObj.stock = Number(productObj.stock);
        }
      }
      
      // Garantir que o preço de venda seja um número
      if ('sellPrice' in productObj && productObj.sellPrice !== undefined) {
        productObj.sellPrice = Number(productObj.sellPrice);
      }
      
      return productObj;
    });
  }
  
  next();
});

// Middleware para popular produtos durante o find
orderSchema.pre(/^find/, function(next) {
  // Usar a abordagem mais simples aqui para evitar problemas de tipagem
  const query = this as any;
  
  if (query.populate) {
    query.populate({
      path: 'products',
      select: 'name description productType sellPrice image brand lensType typeFrame color shape reference modelSunglasses stock'
    });
  }
  
  next();
});

const Order = mongoose.model<IOrder>('Order', orderSchema);

export { Order };