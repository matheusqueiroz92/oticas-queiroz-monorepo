import { model, Schema } from "mongoose";

const financialCategorySchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FinancialCategory = model(
  "FinancialCategory",
  financialCategorySchema
);
