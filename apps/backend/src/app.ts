import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import { setupSwagger } from "./config/swagger";
import { baseHelmetOptions, swaggerCspDirectives } from "./config/helmetConfig";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import laboratoryRoutes from "./routes/laboratoryRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import cashRegisterRoutes from "./routes/cashRegisterRoutes";
import legacyClientRoutes from "./routes/legacyClientRoutes";
import reportRoutes from "./routes/reportRoutes";
import sicrediRoutes from "./routes/sicrediRoutes";
import sicrediSyncRoutes from "./routes/sicrediSyncRoutes";
import botRoutes from "./routes/botRoutes";
import connectDB from "./config/db";
import cors from "cors";
import { globalLimiter } from "./config/rateLimit";
import path from "node:path";
import dotenv from "dotenv";
import { initSicredi } from "./config/sicredi";
import { startSicrediSync } from "./scripts/startSicrediSync";
import { logger } from "./config/logger";

dotenv.config();

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.database();
    this.swagger();
    this.errorHandling();
    this.initPaymentGateways()
  }

  private config(): void {
    // Traefik atua como reverse proxy — necessário para rate-limiter e IPs reais
    this.app.set("trust proxy", 1);

    // CSP restritiva por padrão para todas as rotas da API
    this.app.use(helmet(baseHelmetOptions));

    // CSP mais permissiva somente para o Swagger UI
    this.app.use("/api-docs", helmet({ contentSecurityPolicy: swaggerCspDirectives }));

    // Permissions-Policy: desativa features do browser que esta API nunca usa.
    // Helmet v8 não expõe esta opção via HelmetOptions — adicionado manualmente.
    this.app.use((_req: Request, res: Response, next: NextFunction) => {
      res.setHeader(
        "Permissions-Policy",
        [
          "camera=()",
          "microphone=()",
          "geolocation=()",
          "payment=()",
          "usb=()",
          "accelerometer=()",
          "gyroscope=()",
          "magnetometer=()",
          "fullscreen=(self)",
          "display-capture=()",
        ].join(", ")
      );
      next();
    });

    const allowedOrigins = process.env.NODE_ENV === "production"
      ? ["https://app.oticasqueiroz.com.br"]
      : ["http://localhost:3000", "http://localhost:3333"];

    this.app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Bot-Api-Key",
          "Cache-Control",
          "Pragma",
          "Expires",
          "X-Requested-With",
          "X-Force-Fetch",
          "X-Timestamp",
        ],
        exposedHeaders: ["Content-Disposition"],
        maxAge: 86400, // Cache do preflight por 24 h
      })
    );

    this.app.use(express.json({ limit: "1mb" }));

    // Rate limit global
    this.app.use("/api", globalLimiter);

    // Configurar diretório de imagens
    const imagesPath = path.join(__dirname, "../../public/images");
    
    // Verificar se o diretório existe
    const fs = require('fs');
    if (!fs.existsSync(imagesPath)) {
      try {
        fs.mkdirSync(imagesPath, { recursive: true });
      } catch (err) {
        logger.error("Erro ao criar diretório de imagens", { error: err });
      }
    }

    this.app.use("/images", express.static(imagesPath));
  }

  private routes(): void {
    this.app.get("/api/health", (_req, res) => {
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        uptime: Math.floor(process.uptime()),
      });
    });

    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/users", userRoutes);
    this.app.use("/api/products", productRoutes);
    this.app.use("/api/orders", orderRoutes);
    this.app.use("/api/laboratories", laboratoryRoutes);
    this.app.use("/api/payments", paymentRoutes);
    this.app.use("/api/cash-registers", cashRegisterRoutes);
    this.app.use("/api/legacy-clients", legacyClientRoutes);
    this.app.use("/api/reports", reportRoutes);
    this.app.use("/api/sicredi", sicrediRoutes);
    this.app.use("/api/sicredi-sync", sicrediSyncRoutes);
    this.app.use("/api/bot", botRoutes);

    // Rota de diagnóstico: disponível apenas em desenvolvimento/teste (segurança)
    if (process.env.NODE_ENV !== "production") {
      this.app.get("/api/debug/images-path", (req, res) => {
        const fs = require("fs");
        const imagesPath = path.join(__dirname, "../../public/images");

        try {
          const exists = fs.existsSync(imagesPath);
          let files: string[] = [];
          let subdirectories: string[] = [];

          if (exists) {
            files = fs
              .readdirSync(imagesPath)
              .filter((item: string) => !fs.statSync(path.join(imagesPath, item)).isDirectory())
              .slice(0, 10);
            subdirectories = fs
              .readdirSync(imagesPath)
              .filter((item: string) => fs.statSync(path.join(imagesPath, item)).isDirectory());
          }

          res.status(200).json({
            path: imagesPath,
            exists,
            files,
            subdirectories,
            env: process.env.NODE_ENV,
            serverBaseUrl: process.env.API_URL || "não definido",
          });
        } catch (error) {
          res.status(500).json({
            path: imagesPath,
            exists: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });
    }
  }

  private database(): void {
    if (process.env.NODE_ENV !== "test") {
      connectDB();
    }
  }

  private initPaymentGateways(): void {
    // Inicializar SICREDI
    try {
      initSicredi();
      
      // Iniciar sincronização automática após 5 segundos (apenas em produção)
      if (process.env.NODE_ENV !== 'test') {
        setTimeout(async () => {
          try {
            await startSicrediSync();
          } catch (error) {
            logger.warn("SICREDI Sync: Não foi possível iniciar a sincronização", { error });
          }
        }, 5000);
      }
      
    } catch (error) {
      logger.warn("SICREDI: Não foi possível inicializar a integração", { error });
    }
  }

  private swagger(): void {
    setupSwagger(this.app);
  }
  
  private errorHandling(): void {
    this.app.use(errorMiddleware);
  }
}

export default new App().app;