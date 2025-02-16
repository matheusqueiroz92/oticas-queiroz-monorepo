import express from "express";
import { setupSwagger } from "./config/swagger";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import connectDB from "./config/db";

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
    this.app.use(express.json());
  }

  private routes(): void {
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api", userRoutes);
    this.app.use("/api", productRoutes);
    this.app.use("/api", orderRoutes);
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
