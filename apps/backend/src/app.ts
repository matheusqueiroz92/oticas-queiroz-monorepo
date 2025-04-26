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
import mercadoPagoRoutes from "./routes/mercadoPagoRoutes";
import connectDB from "./config/db";
import cors from "cors";
import path from "node:path";
import dotenv from "dotenv";

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

    const imagesPath = path.join(__dirname, "../../public/images");
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
    this.app.use("/api", mercadoPagoRoutes);
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