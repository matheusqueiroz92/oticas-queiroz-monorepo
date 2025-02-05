import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

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
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Caminho para os arquivos de rotas
};

const swaggerSpec = swaggerJsdoc(options);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const setupSwagger = (app: any) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
