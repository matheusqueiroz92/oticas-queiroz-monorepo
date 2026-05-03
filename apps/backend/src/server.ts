import "./config/env"; // Valida variáveis de ambiente no bootstrap
import app from "./app";
import { logger } from "./config/logger";

const PORT = process.env.PORT || 3333;
const NODE_ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);

  if (NODE_ENV === "development") {
    logger.info(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  } else {
    const apiUrl =
      process.env.API_URL || "https://app.oticasqueiroz.com.br/api";
    logger.info(`Swagger UI available at ${apiUrl}/api-docs`);
  }
});
