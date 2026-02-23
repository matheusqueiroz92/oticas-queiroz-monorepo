import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "./logger";

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI not defined");
  }

  try {
    await mongoose.connect(uri);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection error", { error });
    process.exit(1);
  }
};

export default connectDB;
