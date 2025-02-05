import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, required: true }, // Ex.: "grau", "solar"
  },
  { timestamps: true }
);

export const Product = model("Product", productSchema);
