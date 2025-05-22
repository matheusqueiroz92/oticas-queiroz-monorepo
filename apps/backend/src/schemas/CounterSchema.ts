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
    default: 300000 
  }
});

export const Counter = model<ICounter>("Counter", counterSchema);