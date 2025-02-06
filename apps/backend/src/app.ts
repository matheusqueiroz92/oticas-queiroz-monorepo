import express from "express";
import { setupSwagger } from "./config/swagger";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes"; // Importe as rotas de pedidos
import connectDB from "./config/db";

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.database();
    this.swagger();
  }

  private config(): void {
    this.app.use(express.json());
  }

  private routes(): void {
    this.app.use("/api", userRoutes);
    this.app.use("/api", productRoutes);
    this.app.use("/api", orderRoutes); // Adicione as rotas de pedidos
  }

  private database(): void {
    connectDB();
  }

  private swagger(): void {
    setupSwagger(this.app);
  }
}

export default new App().app;
