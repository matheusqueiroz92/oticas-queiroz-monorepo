import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import express from "express";
import path from "path";

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
// export const setupSwagger = (app: any) => {
//   app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// };

export const setupSwagger = (app: any) => {
  // Configuração para servir arquivos estáticos do Swagger UI
  app.use('/api-docs', express.static('node_modules/swagger-ui-dist'));
  
  // Rota principal do Swagger UI
  app.get('/api-docs', (req: any, res: { sendFile: (arg0: string) => void; }) => {
    res.sendFile(path.join(__dirname, '../node_modules/swagger-ui-dist/index.html'));
  });
  
  // Especificação OpenAPI
  app.get('/api-docs.json', (req: any, res: { json: (arg0: object) => void; }) => {
    res.json(swaggerSpec);
  });
};
