import express from "express";
import dotenv from "dotenv";
import { setupSwagger } from "./config/swagger";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3333;

// Configurar Swagger
setupSwagger(app);

app.get("/", (req, res) => {
  res.send("Backend da Óticas Queiroz");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
