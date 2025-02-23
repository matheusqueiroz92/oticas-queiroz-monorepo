import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true }, // Ex.: "Armação styllus flutuante"
    category: { type: String, required: true }, // Ex.: "grau", "solar"
    description: { type: String, required: true }, // Ex.: "acetato preto", "fio de nylon metálico", "flutuante"
    brand: { type: String, required: true }, // Ex.: "Rayban", "Frontier", "Prada"
    image: { type: String, required: false }, // Ex.: caminho do arquivo "images/740173359905-oculos-de-sol.png"
    modelGlasses: { type: String, required: true }, // Ex.: "Aviador",  "Retrô", ""
    price: { type: Number, required: true }, // Ex.: "R$200,00"
    stock: { type: Number, required: true, default: 0 }, // Ex.: "5"
  },
  { timestamps: true }
);

export const Product = model("Product", productSchema);
