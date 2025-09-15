import express from "express";
import { setupSwagger } from "./config/swagger";
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
import connectDB from "./config/db";
import cors from "cors";
import path from "node:path";
import dotenv from "dotenv";
import { initSicredi } from "./config/sicredi";
import { startSicrediSync } from "./scripts/startSicrediSync";

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
    const allowedOrigins = process.env.NODE_ENV === "production" 
      ? ["https://app.oticasqueiroz.com.br", "https://app.oticasqueiroz.com.br/api-docs"]
      : ["http://localhost:3000"];

    this.app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
      })
    );

    this.app.use(express.json());

    // Log do caminho das imagens para depuração
    const imagesPath = path.join(__dirname, "../../public/images");
    console.log("Configuração de servidor: Diretório de imagens =", imagesPath);
    
    // Verificar se o diretório existe
    const fs = require('fs');
    if (fs.existsSync(imagesPath)) {
      console.log("✅ Diretório de imagens encontrado com sucesso");
      // Listar os subdiretórios para confirmar a estrutura
      try {
        const subdirs = fs.readdirSync(imagesPath)
          .filter((item: string) => fs.statSync(path.join(imagesPath, item)).isDirectory());
        console.log("📁 Subdiretórios de imagens:", subdirs);
      } catch (err) {
        console.error("❌ Erro ao listar subdiretórios:", err);
      }
    } else {
      console.error("❌ AVISO: Diretório de imagens não encontrado:", imagesPath);
      // Tentar criar o diretório se não existir
      try {
        fs.mkdirSync(imagesPath, { recursive: true });
        console.log("✅ Diretório de imagens criado com sucesso");
      } catch (err) {
        console.error("❌ Erro ao criar diretório de imagens:", err);
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
    this.app.use("/api", userRoutes);
    this.app.use("/api", productRoutes);
    this.app.use("/api", orderRoutes);
    this.app.use("/api", laboratoryRoutes);
    this.app.use("/api", paymentRoutes);
    this.app.use("/api", cashRegisterRoutes);
    this.app.use("/api", legacyClientRoutes);
    this.app.use("/api", reportRoutes);
    this.app.use("/api/sicredi", sicrediRoutes);
    this.app.use("/api/sicredi-sync", sicrediSyncRoutes);
    
    // Adicione a rota de diagnóstico aqui
    this.app.get("/api/debug/images-path", (_req, res) => {
      const fs = require('fs');
      const imagesPath = path.join(__dirname, "../../public/images");
      
      try {
        // Verificar se o diretório existe
        const exists = fs.existsSync(imagesPath);
        
        // Se existir, listar arquivos e subdiretórios
        let files = [];
        let subdirectories = [];
        
        if (exists) {
          files = fs.readdirSync(imagesPath)
            .filter((item: string) => !fs.statSync(path.join(imagesPath, item)).isDirectory())
            .slice(0, 10); // Limitamos a 10 arquivos para não sobrecarregar
            
          subdirectories = fs.readdirSync(imagesPath)
            .filter((item: string) => fs.statSync(path.join(imagesPath, item)).isDirectory());
        }
        
        res.status(200).json({
          path: imagesPath,
          exists,
          files,
          subdirectories,
          env: process.env.NODE_ENV,
          serverBaseUrl: process.env.API_URL || 'não definido',
        });
      } catch (error) {
        res.status(500).json({
          path: imagesPath,
          exists: false,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : "Stack not available"
        });
      }
    });
  }

  private database(): void {
    connectDB();
  }

  private initPaymentGateways(): void {
    // Inicializar SICREDI
    try {
      initSicredi();
      
      // Iniciar sincronização automática após 5 segundos
      setTimeout(async () => {
        try {
          await startSicrediSync();
        } catch (error) {
          console.warn("⚠️  SICREDI Sync: Não foi possível iniciar a sincronização:", error);
        }
      }, 5000);
      
    } catch (error) {
      console.warn("⚠️  SICREDI: Não foi possível inicializar a integração:", error);
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