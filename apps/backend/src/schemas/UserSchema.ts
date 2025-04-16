import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import type { IUser } from "../interfaces/IUser";
import { isValidCNPJ, isValidCPF } from "../utils/validators";

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
        partialFilterExpression: { email: { $ne: null } }
      }
    },
    password: { type: String, required: true },
    image: { type: String },
    role: {
      type: String,
      enum: ["admin", "employee", "customer", "institution"],
      required: true,
    },
    address: { type: String },
    phone: { type: String },
    cpf: {
      type: String,
      required: function(this: { role: string }) {
        return this.role === 'customer' || this.role === 'employee' || this.role === 'admin';
      },
      validate: {
        validator: function(v: string) {
          // Se for instituição, não validar CPF
          if (this.role === 'institution') return true;
          return isValidCPF(v);
        },
        message: (props) => `${props.value} não é um CPF válido!`,
      }
    },
    cnpj: {
      type: String,
      required: function(this: { role: string }) {
        return this.role === 'institution';
      },
      validate: {
        validator: (v: string) => {
          return isValidCNPJ(v);
        },
        message: (props) => `${props.value} não é um CNPJ válido!`,
      }
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

// Hook pre-save para garantir campos corretos conforme o tipo
userSchema.pre('save', function(next) {
  // Para instituições, garantir que CPF não exista
  if (this.role === 'institution') {
    this.cpf = undefined;
  } else {
    // Para não-instituições, garantir que CNPJ não exista
    this.cnpj = undefined;
  }
  
  // Limpar outros campos opcionais para não serem null
  if (this.email === null || this.email === '') {
    this.email = undefined;
  }
  
  next();
});

// Adicionar índices manualmente, fora do schema
// Para CPF (apenas para não-instituições)
userSchema.index(
  { cpf: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      cpf: { $exists: true, $ne: null },
      role: { $ne: "institution" }
    }
  }
);

// Para CNPJ (apenas para instituições)
userSchema.index(
  { cnpj: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      cnpj: { $exists: true, $ne: null },
      role: "institution"
    }
  }
);

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>("User", userSchema);