import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, beforeEach, afterAll } from "@jest/globals";
import "../schemas/UserSchema";
import "../schemas/CashRegisterSchema";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

let mongoServer: MongoMemoryReplSet;
let tempUploadDir: string;

export const createTempUploadDir = () => {
  const tempDir = path.join(os.tmpdir(), "test-uploads");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

beforeAll(async () => {
  await mongoose.disconnect();

  // MongoMemoryReplSet é necessário para suportar transações (session.withTransaction)
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Criar diretório temporário para uploads
  tempUploadDir = createTempUploadDir();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }

  // Limpar diretório temporário
  if (tempUploadDir && fs.existsSync(tempUploadDir)) {
    fs.rmSync(tempUploadDir, { recursive: true, force: true });
  }
});

beforeEach(async () => {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection is not established");
  }

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // Limpar arquivos de upload antes de cada teste
  if (tempUploadDir && fs.existsSync(tempUploadDir)) {
    const files = fs.readdirSync(tempUploadDir);
    for (const file of files) {
      fs.unlinkSync(path.join(tempUploadDir, file));
    }
  }
});
