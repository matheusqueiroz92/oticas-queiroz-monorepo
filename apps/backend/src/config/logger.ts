import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const format = isProduction
  ? winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  : winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.colorize(),
      winston.format.printf(
        ({ level, message, timestamp, ...meta }) =>
          `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`
      )
    );

export const logger = winston.createLogger({
  silent: isTest,
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format,
  transports: [new winston.transports.Console()],
});
