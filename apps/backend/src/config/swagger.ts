import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

dotenv.config();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Óticas Queiroz API",
      version: "1.0.0",
      description: "API para gerenciamento da Óticas Queiroz",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3333",
        description: process.env.NODE_ENV === "production" 
          ? "Production server" 
          : "Local server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Caminho para os arquivos de rotas da aplicação
};

const swaggerSpec = swaggerJsdoc(options);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const setupSwagger = (app: any) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
