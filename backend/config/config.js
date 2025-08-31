module.exports = {
  development: {
    port: process.env.PORT || 5000,
    mongoUri:
      process.env.MONGODB_URI || "mongodb://localhost:27017/smart-investor-dev",
    jwtSecret: process.env.JWT_SECRET || "dev_secret_key_change_in_production",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    corsOrigin: process.env.FRONTEND_URL || "http://localhost:3000",
  },
  production: {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    frontendUrl: process.env.FRONTEND_URL,
    corsOrigin: process.env.FRONTEND_URL || false,
  },
  test: {
    port: process.env.PORT || 5001,
    mongoUri:
      process.env.MONGODB_URI_TEST ||
      "mongodb://localhost:27017/smart-investor-test",
    jwtSecret: "test_secret",
    frontendUrl: "http://localhost:3000",
    corsOrigin: "http://localhost:3000",
  },
};
