const Joi = require("joi");

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(5000),
  MONGODB_URI: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.required(),
    otherwise: Joi.string().default(
      "mongodb://localhost:27017/smart-investor-dev"
    ),
  }),
  MONGODB_URI_TEST: Joi.string().default(
    "mongodb://localhost:27017/smart-investor-test"
  ),
  JWT_SECRET: Joi.string().when("NODE_ENV", {
    is: "production",
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().default("dev_secret_key_change_in_production"),
  }),
  FRONTEND_URL: Joi.string().uri().default("http://localhost:3000"),
  // Alpaca API configuration
  ALPACA_API_KEY: Joi.string().required(),
  ALPACA_SECRET_KEY: Joi.string().required(),
}).unknown();

// Validate environment variables
const { error, value: env } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.details[0].message}`);
}

module.exports = {
  development: {
    port: env.PORT,
    mongoUri: env.MONGODB_URI,
    jwtSecret: env.JWT_SECRET,
    frontendUrl: env.FRONTEND_URL,
    corsOrigin: env.FRONTEND_URL,
    alpaca: {
      apiKey: env.ALPACA_API_KEY,
      secretKey: env.ALPACA_SECRET_KEY,
    },
  },
  production: {
    port: env.PORT,
    mongoUri: env.MONGODB_URI,
    jwtSecret: env.JWT_SECRET,
    frontendUrl: env.FRONTEND_URL,
    corsOrigin: env.FRONTEND_URL || false,
    alpaca: {
      apiKey: env.ALPACA_API_KEY,
      secretKey: env.ALPACA_SECRET_KEY,
    },
  },
  test: {
    port: env.PORT || 5001,
    mongoUri: env.MONGODB_URI_TEST,
    jwtSecret: "test_secret",
    frontendUrl: env.FRONTEND_URL,
    corsOrigin: env.FRONTEND_URL,
    alpaca: {
      apiKey: env.ALPACA_API_KEY,
      secretKey: env.ALPACA_SECRET_KEY,
    },
  },
};
