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
import lensTypeRoutes from "./routes/lensTypeRoutes";
import connectDB from "./config/db";
import cors from "cors";
import path from "node:path"; // Importe o módulo 'path'

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.database();
    this.swagger();
    this.errorHandling();
  }

  private config(): void {
    // Configuração do CORS
    this.app.use(
      cors({
        origin: "http://localhost:3000", // Permite requisições do frontend
        credentials: true, // Permite o envio de cookies e headers de autenticação
      })
    );

    // Outras configurações
    this.app.use(express.json());

    // Servir arquivos estáticos da pasta 'public/images'
    const imagesPath = path.join(__dirname, "../../public/images");
    this.app.use("/images", express.static(imagesPath));
  }

  private routes(): void {
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api", userRoutes);
    this.app.use("/api", productRoutes);
    this.app.use("/api", orderRoutes);
    this.app.use("/api", laboratoryRoutes);
    this.app.use("/api", paymentRoutes);
    this.app.use("/api", cashRegisterRoutes);
    this.app.use("/api", legacyClientRoutes);
    this.app.use("/api", reportRoutes);
    this.app.use("/api", lensTypeRoutes);
  }

  private database(): void {
    connectDB();
  }

  private swagger(): void {
    setupSwagger(this.app);
  }

  private errorHandling(): void {
    this.app.use(errorMiddleware);
  }
}

export default new App().app;
