import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3333;
const NODE_ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);

  if (NODE_ENV === "development") {
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  } else {
    const apiUrl =
      process.env.API_URL || "https://app.oticasqueiroz.com.br/api";
    console.log(`Swagger UI available at ${apiUrl}/api-docs`);
  }
});
