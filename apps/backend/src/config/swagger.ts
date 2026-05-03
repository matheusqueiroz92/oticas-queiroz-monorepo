import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import type { Application } from "express";

dotenv.config();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Óticas Queiroz API",
      version: "1.0.0",
      description: "API para gerenciamento das Óticas Queiroz",
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

/**
 * Configura Swagger UI.
 * Em produção: disponível apenas se SWAGGER_ENABLED=true (com opção de usar ?key=SWAGGER_SECRET para proteção)
 * Em desenvolvimento: sempre disponível
 */
export const setupSwagger = (app: Application) => {
  const isProduction = process.env.NODE_ENV === "production";
  const swaggerEnabled =
    !isProduction || process.env.SWAGGER_ENABLED === "true";

  if (!swaggerEnabled) {
    return;
  }

  const swaggerSecret = process.env.SWAGGER_SECRET;

  const swaggerMiddleware = (req: any, res: any, next: any) => {
    if (!isProduction) {
      return swaggerUi.setup(swaggerSpec)(req, res, next);
    }
    const key = req.query.key;
    if (swaggerSecret && key !== swaggerSecret) {
      return res.status(401).json({
        status: "error",
        message: "Acesso negado. Forneça o parâmetro key correto.",
      });
    }
    return swaggerUi.setup(swaggerSpec)(req, res, next);
  };

  app.use("/api-docs", swaggerUi.serve, swaggerMiddleware);
};
