import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../interfaces/IOrder';
import { CounterService } from '../services/CounterService';

const paymentHistorySchema = new Schema({
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  method: {
    type: String,
    required: true
  }
}, { _id: false });

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
  institutionId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  isInstitutionalOrder: {
    type: Boolean,
    default: false
  },
  responsibleClientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  hasResponsible: {
    type: Boolean,
    default: false
  },
  products: [{
    type: Schema.Types.Mixed,
    required: true
  }],
  serviceOrder: {
    type: String,
    unique: true, // Garantir que não haja duplicatas
    index: true   // Indexar para busca rápida
  },
  paymentMethod: {
    type: String, 
    required: true,
    enum: ["credit", "debit", "cash", "pix", "installment", "bank_slip", "promissory_note", "check"],
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "partially_paid", "paid"],
    default: "pending",
    required: true
  },
  paymentHistory: [paymentHistorySchema],
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
      sph: String,
      cyl: String,
      axis: Number,
      pd: Number,
    },
    leftEye: {
      sph: String,
      cyl: String,
      axis: Number,
      pd: Number,
    },
    nd: Number,
    oc: Number,
    addition: Number,
    bridge: Number,
    rim: Number,
    vh: Number,
    sh: Number,
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

// Middleware pre-save para gerar serviceOrder automaticamente
orderSchema.pre("save", async function(next) {
  try {
    // Se é um novo documento e não tem serviceOrder definido
    if (this.isNew && !this.serviceOrder) {
      // Obter o próximo número da sequência
      const nextNumber = await CounterService.getNextSequence('serviceOrder');
      this.serviceOrder = nextNumber.toString();
    }
    
    next();
  } catch (error) {
    console.error('Erro ao gerar serviceOrder:', error);
    next(error instanceof Error ? error : new Error('Erro ao gerar número de ordem de serviço'));
  }
});

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
  
  // Garantir valores numéricos corretos em paymentHistory
  if (this.paymentHistory && Array.isArray(this.paymentHistory)) {
    this.paymentHistory = this.paymentHistory.map(entry => {
      if (entry && typeof entry === 'object') {
        // Garantir que o amount seja um número
        if ('amount' in entry && entry.amount !== undefined) {
          entry.amount = Number(entry.amount);
        }
        // Garantir que a data seja um objeto Date
        if ('date' in entry && entry.date && !(entry.date instanceof Date)) {
          entry.date = new Date(entry.date);
        }
      }
      return entry;
    });
  }
  
  next();
});

const Order = mongoose.model<IOrder>('Order', orderSchema);

export { Order };