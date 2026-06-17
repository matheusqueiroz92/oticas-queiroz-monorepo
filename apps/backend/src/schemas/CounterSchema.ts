import { Schema, model } from "mongoose";
import {
  SERVICE_ORDER_COUNTER_ID,
  SERVICE_ORDER_COUNTER_INITIAL,
} from "../constants/serviceOrder";

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
    default: SERVICE_ORDER_COUNTER_INITIAL
  }
});

// Middleware para garantir que o serviceOrder nunca seja menor que o mínimo configurado
counterSchema.pre('save', function(next) {
  if (this._id === SERVICE_ORDER_COUNTER_ID && this.sequence < SERVICE_ORDER_COUNTER_INITIAL) {
    console.log(`Corrigindo sequence de ${this.sequence} para ${SERVICE_ORDER_COUNTER_INITIAL}`);
    this.sequence = SERVICE_ORDER_COUNTER_INITIAL;
  }
  next();
});

export const Counter = model<ICounter>("Counter", counterSchema);