import express from "express";
import { setupSwagger } from "./config/swagger";
import userRoutes from "./routes/userRoutes"; // Importe as rotas de usuário
import productRoutes from "./routes/productRoutes"; // Importe as rotas de produtos
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
    this.app.use("/api", userRoutes); // Adicione as rotas de usuário
    this.app.use("/api", productRoutes); // Adicione as rotas de produtos
  }

  private database(): void {
    connectDB();
  }

  private swagger(): void {
    setupSwagger(this.app);
  }
}

export default new App().app;
