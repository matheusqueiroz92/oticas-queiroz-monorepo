import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import type { Request, RequestHandler } from "express";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

// Magic bytes (file signatures) para validação do conteúdo real
const FILE_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46], // RIFF
  ],
};

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

// Criar diretórios na inicialização da aplicação
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
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])
      ? ext
      : ".jpg";
    cb(null, `${uuidv4()}${safeExt}`);
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
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    const error = new Error(
      "Extensão de arquivo não permitida. Use .jpg, .jpeg, .png ou .webp."
    );
    error.name = "MulterError";
    cb(error);
    return;
  }
  cb(null, true);
};

/**
 * Middleware pós-upload: valida magic bytes do arquivo (assinatura real do formato).
 * Deve ser usado após o multer em rotas de upload.
 */
export const validateFileMagicBytes = (
  req: Request & { file?: Express.Multer.File },
  _res: express.Response,
  next: express.NextFunction
) => {
  const file = req.file;
  if (!file?.path) return next();

  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(file.path, "r");
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    const signatures = FILE_SIGNATURES[file.mimetype];
    if (!signatures) {
      fs.unlinkSync(file.path);
      const err = new Error("Tipo de arquivo não suportado.");
      err.name = "MulterError";
      return next(err);
    }

    const matches = signatures.some((sig) =>
      sig.every((byte, i) => buffer[i] === byte)
    );

    // WebP: RIFF....WEBP (bytes 8-11)
    if (file.mimetype === "image/webp") {
      const isRiff =
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46;
      if (!isRiff) {
        fs.unlinkSync(file.path);
        const err = new Error("Arquivo WebP inválido.");
        err.name = "MulterError";
        return next(err);
      }
      const webpBuf = Buffer.alloc(4);
      const fd2 = fs.openSync(file.path, "r");
      fs.readSync(fd2, webpBuf, 0, 4, 8);
      fs.closeSync(fd2);
      const isWebp =
        webpBuf[0] === 0x57 &&
        webpBuf[1] === 0x45 &&
        webpBuf[2] === 0x42 &&
        webpBuf[3] === 0x50;
      if (!isWebp) {
        fs.unlinkSync(file.path);
        const err = new Error("Arquivo WebP inválido.");
        err.name = "MulterError";
        return next(err);
      }
    } else if (!matches) {
      fs.unlinkSync(file.path);
      const err = new Error(
        "Conteúdo do arquivo não corresponde ao tipo declarado."
      );
      err.name = "MulterError";
      return next(err);
    }

    next();
  } catch (e) {
    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (_) {}
    next(e);
  }
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
