import { Schema, model } from "mongoose";
import type { ILaboratory } from "../interfaces/ILaboratory";

const laboratorySchema = new Schema<ILaboratory>(
  {
    name: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      number: { type: String, required: true },
      complement: { type: String },
      neighborhood: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    contactName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Laboratory = model<ILaboratory>("Laboratory", laboratorySchema);
