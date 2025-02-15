import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import type { IUser } from "../interfaces/IUser";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "employee", "customer"],
      required: true,
    },
    address: { type: String }, // Apenas para clientes
    phone: { type: String }, // Apenas para clientes
    prescription: {
      // Apenas para clientes
      // Grau dos óculos
      leftEye: { type: Number },
      rightEye: { type: Number },
      addition: { type: Number },
    },
    purchases: [{ type: Schema.Types.ObjectId, ref: "Order" }], // IDs das compras (apenas para clientes)
    debts: { type: Number, default: 0 }, // Débitos (apenas para clientes)
  },
  { timestamps: true } // Adiciona createdAt e updatedAt automaticamente
);

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>("User", userSchema);
