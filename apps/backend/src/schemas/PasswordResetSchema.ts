import { Schema, model } from "mongoose";

interface IPasswordReset {
  userId: Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "1h" },
  expiresAt: { type: Date, required: true },
});

// Índice para garantir unicidade do token e performance de busca
passwordResetSchema.index({ token: 1 }, { unique: true });

export const PasswordReset = model<IPasswordReset>(
  "PasswordReset",
  passwordResetSchema
);
