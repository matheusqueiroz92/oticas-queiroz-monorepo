import { Schema, model } from "mongoose";

const lensTypeSchema = new Schema(
  {
    name: { type: String, required: true }, // Ex.: "Transitions XTractive"
    description: { type: String, required: false }, // Ex.: "Lente fotocromática de última geração"
    brand: { type: String, required: false }, // Ex.: "Transitions"
  },
  { timestamps: true }
);

export const LensType = model("LensType", lensTypeSchema);
