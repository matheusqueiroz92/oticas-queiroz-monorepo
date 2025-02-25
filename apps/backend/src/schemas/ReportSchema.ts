import { Schema, model } from "mongoose";
import { ReportData } from "../interfaces/IReport";

const reportSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["sales", "inventory", "customers", "orders", "financial"],
      required: true,
    },
    filters: {
      startDate: Date,
      endDate: Date,
      status: [String],
      paymentMethod: [String],
      productCategory: [String],
      minValue: Number,
      maxValue: Number,
    },
    data: Schema.Types.Mixed, // Dados do relatório tipados como ReportData na interface
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    format: {
      type: String,
      enum: ["json", "pdf", "excel"],
      default: "json",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "error"],
      default: "pending",
    },
    errorMessage: String,
  },
  { timestamps: true }
);

export const Report = model("Report", reportSchema);
