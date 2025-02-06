import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

beforeAll(async () => {
  if (!uri) {
    throw new Error("MONGODB_URI não definida");
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
});

beforeEach(async () => {
  // Limpa todas as coleções antes de cada teste
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
