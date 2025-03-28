import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import type { IUser } from "../interfaces/IUser";
import { isValidCPF } from "../utils/validators";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      index: {
        unique: true,
        sparse: true,
        partialFilterExpression: { email: { $ne: null } }
      }
    },
    password: { type: String, required: true },
    image: { type: String },
    role: {
      type: String,
      enum: ["admin", "employee", "customer"],
      required: true,
    },
    address: { type: String },
    phone: { type: String },
    cpf: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v: string) => {
          return isValidCPF(v);
        },
        message: (props) => `${props.value} não é um CPF válido!`,
      },
    },
    rg: {
      type: String,
      default: null,
    },
    birthDate: {
      type: Date,
      validate: {
        validator: (date: Date) => {
          return (
            date instanceof Date &&
            !Number.isNaN(date.getTime()) &&
            date <= new Date()
          );
        },
        message: "Data de nascimento inválida ou no futuro!",
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

userSchema.pre('save', function(next) {
  if (this.email === null || this.email === '') {
      this.email = undefined;
  }
  next();
});

export const User = model<IUser>("User", userSchema);
