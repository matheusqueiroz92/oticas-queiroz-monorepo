import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import type { Request, RequestHandler } from "express";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AllowedMimeTypes = (typeof ALLOWED_TYPES)[number];

// Criar diretórios de upload se não existirem
const createUploadDirs = () => {
  const baseDir = path.join(__dirname, "../../../public/images");
  const dirs = ["users", "products"];

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  for (const dir of dirs) {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
};

// Criar diretórios na inicialização
createUploadDirs();

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const baseDir = path.join(__dirname, "../../../public/images");

    // Determinar o diretório com base no campo de upload
    let uploadDir: string;

    if (file.fieldname === "productImage") {
      uploadDir = path.join(baseDir, "products");
    } else if (file.fieldname === "image" || file.fieldname === "userImage") {
      // Suporta tanto "image" (para registro) quanto "userImage" (para atualização de perfil)
      uploadDir = path.join(baseDir, "users");
    } else {
      // Diretório padrão
      uploadDir = path.join(baseDir, "users");
    }

    cb(null, uploadDir);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!ALLOWED_TYPES.includes(file.mimetype as AllowedMimeTypes)) {
    const error = new Error(
      "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP."
    );
    error.name = "MulterError";
    cb(error);
    return;
  }
  cb(null, true);
};

// Configuração base para uploads
const uploadBase = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE,
  },
  fileFilter,
});

// Exporta diferentes configurações para diferentes casos de uso
export const uploadUserImage = uploadBase.single("userImage");
export const uploadProductImage = uploadBase.single("productImage");

// Para compatibilidade com código existente
const upload = uploadBase as unknown as {
  single: (fieldName: string) => RequestHandler;
};

export default upload;
