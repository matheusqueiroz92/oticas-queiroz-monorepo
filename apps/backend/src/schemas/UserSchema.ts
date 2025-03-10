import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import type { IUser } from "../interfaces/IUser";
import { isValidCPF } from "../utils/validators";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String },
    role: {
      type: String,
      enum: ["admin", "employee", "customer"],
      required: true,
    },
    address: { type: String }, // Apenas para clientes
    phone: { type: String }, // Apenas para clientes
    cpf: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v: string) => {
          // Valida formato e algoritmo do CPF
          return isValidCPF(v);
        },
        message: (props) => `${props.value} não é um CPF válido!`,
      },
    },
    rg: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => {
          // RG limpo deve ter pelo menos 6 dígitos
          return /^\d{6,14}$/.test(v.replace(/[^\d]/g, ""));
        },
        message: (props) => `${props.value} não é um RG válido!`,
      },
    },
    birthDate: {
      type: Date,
      validate: {
        validator: (date: Date) => {
          // Verificar se é uma data válida e não é no futuro
          return (
            date instanceof Date &&
            !Number.isNaN(date.getTime()) &&
            date <= new Date()
          );
        },
        message: (props) => "Data de nascimento inválida ou no futuro!",
      },
    },
    purchases: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    debts: { type: Number, default: 0 },
    sales: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>("User", userSchema);

// Hook pre-save para hashear a senha antes de salvar
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   try {
//     this.password = await bcrypt.hash(this.password, 10);
//     next();
//   } catch (err: unknown) {
//     if (err instanceof Error) {
//       next(err);
//     } else {
//       next(new Error("Erro desconhecido ao hashear senha"));
//     }
//   }
// });
