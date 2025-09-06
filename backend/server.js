const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const logger = require("./utils/logger");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const cacheService = require("./services/cacheService");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");

// Environment configuration
const env = process.env.NODE_ENV || "development";
const config = require("./config/config")[env];

const app = express();

// Security and performance middleware
app.use(helmet());
app.use(compression());

// Request logging (only in development and staging)
if (env !== "production") {
  app.use(requestLogger);
}

// Rate limiting
app.use("/api/", apiLimiter);
// Apply strict rate limiting only to login/register endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: config.corsOrigin || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

// Add this debug line
console.log("Registered transaction routes:");
transactionRoutes.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(
      `  ${Object.keys(middleware.route.methods).join(", ").toUpperCase()} ${
        middleware.route.path
      }`
    );
  }
});

// Add this after your existing routes
const alpacaPrices = require("./services/alpacaPrices");
alpacaPrices.connect();

// Enhanced health check
app.get("/api/health", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: env,
    version: require("./package.json").version,
    database: "disconnected",
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };

  try {
    await mongoose.connection.db.admin().ping();
    health.database = "connected";
  } catch (error) {
    health.status = "error";
    health.database = "disconnected";
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
});

// Cache statistics endpoint (development only)
if (env === "development") {
  app.get("/api/cache-stats", (req, res) => {
    res.json({
      success: true,
      data: cacheService.getCacheStats(),
    });
  });
}

// Serve static files from React build in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  // Handle React routing, return all requests to React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

// Connect to MongoDB with optimized settings
mongoose
  .connect(config.mongoUri, {
    // Connection pooling settings
    maxPoolSize: 10, // Maximum number of connections
    minPoolSize: 2, // Minimum number of connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Performance optimizations
    bufferCommands: false, // Disable mongoose buffering
    // Additional optimizations
    heartbeatFrequencyMS: 10000, // Check server every 10 seconds
    retryWrites: true,
    w: "majority", // Write concern for better consistency
  })
  .then(() =>
    logger.info(`Connected to MongoDB`, {
      environment: env,
      poolSize: "2-10 connections",
    })
  )
  .catch((err) => {
    logger.error("MongoDB connection error", { error: err.message });
    process.exit(1);
  });

// Global error handler (must be last middleware)
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`, {
    environment: env,
    port: PORT,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  mongoose.connection.close(() => {
    process.exit(0);
  });
});
