import { Schema, model, type Types } from "mongoose";

interface IPasswordReset {
  userId: Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // Remova a propriedade unique: true aqui, já que definiremos o índice abaixo
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "1h" }, // TTL index para limpeza automática
  expiresAt: { type: Date, required: true },
});

// Criar índice composto para melhorar a performance nas buscas
passwordResetSchema.index({ userId: 1, token: 1 });

// Índice para token para garantir unicidade e buscas rápidas
// Esta é a única definição de índice para token
passwordResetSchema.index({ token: 1 }, { unique: true });

// Índice para a data de expiração para facilitar limpeza
passwordResetSchema.index({ expiresAt: 1 });

export const PasswordReset = model<IPasswordReset>(
  "PasswordReset",
  passwordResetSchema
);
