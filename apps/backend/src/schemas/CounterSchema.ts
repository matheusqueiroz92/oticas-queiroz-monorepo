import { Schema, model } from "mongoose";

interface ICounter {
  _id: string;
  sequence: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { 
    type: String, 
    required: true 
  },
  sequence: { 
    type: Number, 
    default: 299999 // Padrão será 299999, para que o primeiro número gerado seja 300000
  }
});

// Middleware para garantir que o serviceOrder nunca seja menor que 300000
counterSchema.pre('save', function(next) {
  if (this._id === 'serviceOrder' && this.sequence < 299999) {
    console.log(`Corrigindo sequence de ${this.sequence} para 299999`);
    this.sequence = 299999;
  }
  next();
});

export const Counter = model<ICounter>("Counter", counterSchema);