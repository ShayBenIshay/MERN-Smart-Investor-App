const winston = require("winston");
const fs = require("fs");
const path = require("path");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development - more readable
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Handle request logs more cleanly
    if (message === "Incoming request" && meta.method && meta.url) {
      return `${timestamp} [${level}]: ${meta.method} ${meta.url} from ${meta.ip}`;
    }
    if (message === "Request completed" && meta.method && meta.url) {
      return `${timestamp} [${level}]: ${meta.method} ${meta.url} → ${meta.statusCode} (${meta.duration})`;
    }

    // For other logs, show message and key metadata
    const keyMeta = {};
    if (meta.service) keyMeta.service = meta.service;
    if (meta.environment) keyMeta.env = meta.environment;
    if (meta.port) keyMeta.port = meta.port;
    if (meta.error) keyMeta.error = meta.error;

    const metaStr = Object.keys(keyMeta).length
      ? ` | ${JSON.stringify(keyMeta)}`
      : "";
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// File format - clean and readable
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    if (message === "Incoming request" && meta.method && meta.url) {
      return `${timestamp} [${level.toUpperCase()}] ${meta.method} ${
        meta.url
      } from ${meta.ip}`;
    }
    if (message === "Request completed" && meta.method && meta.url) {
      return `${timestamp} [${level.toUpperCase()}] ${meta.method} ${
        meta.url
      } → ${meta.statusCode} (${meta.duration})`;
    }

    const keyMeta = {};
    if (meta.service) keyMeta.service = meta.service;
    if (meta.environment) keyMeta.env = meta.environment;
    if (meta.port) keyMeta.port = meta.port;
    if (meta.error) keyMeta.error = meta.error;

    const metaStr = Object.keys(keyMeta).length
      ? ` | ${JSON.stringify(keyMeta)}`
      : "";
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "smart-investor-api" },
  transports: [
    // Console transport with different format for development
    new winston.transports.Console({
      format: process.env.NODE_ENV === "production" ? logFormat : consoleFormat,
    }),
    // File transport for all environments
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: fileFormat,
    }),
  ],
});

module.exports = logger;
