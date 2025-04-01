import mongoose, { Schema, Document } from 'mongoose';

export interface ILoginActivity {
  _id?: string;
  userId: mongoose.Types.ObjectId | string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  successful: boolean;
  location?: string;
  device?: string;
}

interface LoginActivityDocument extends Document, Omit<ILoginActivity, '_id'> {}

const loginActivitySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  successful: {
    type: Boolean,
    required: true
  },
  location: {
    type: String
  },
  device: {
    type: String
  }
}, { timestamps: true });

loginActivitySchema.index({ userId: 1, timestamp: -1 });

const LoginActivity = mongoose.model<LoginActivityDocument>('LoginActivity', loginActivitySchema);

export { LoginActivity };