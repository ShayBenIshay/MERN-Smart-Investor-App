const Joi = require("joi");
const logger = require("../utils/logger");

/**
 * Generic Joi validation middleware factory
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert types automatically
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      logger.warn("Validation failed", {
        source,
        errors,
        originalData: data,
      });

      // Also log to console for immediate debugging
      console.log("🚨 VALIDATION FAILED:");
      console.log("📋 Errors:", JSON.stringify(errors, null, 2));
      console.log("📦 Original data:", JSON.stringify(data, null, 2));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

// Auth validation schemas
const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password:
      process.env.NODE_ENV === "production"
        ? Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
              "string.min": "Password must be at least 8 characters long",
              "string.pattern.base":
                "Password must contain at least one lowercase letter, one uppercase letter, and one number",
              "any.required": "Password is required",
            })
        : Joi.string().allow("").default("").messages({
            "any.required": "Password is required",
          }),
    firstName: Joi.string().trim().max(50).default(""),
    lastName: Joi.string().trim().max(50).default(""),
    cash: Joi.number().min(0).default(0),
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password:
      process.env.NODE_ENV === "production"
        ? Joi.string().required()
        : Joi.string().allow("").default(""),
  }),

  profileUpdate: Joi.object({
    email: Joi.string().email().lowercase().trim(),
    firstName: Joi.string().trim().max(50).allow(""),
    lastName: Joi.string().trim().max(50).allow(""),
    cash: Joi.number().min(0),
  }).min(1), // At least one field must be provided
};

// Transaction validation schemas
const transactionSchemas = {
  create: Joi.object({
    operation: Joi.string().valid("buy", "sell").required().messages({
      "any.only": 'Operation must be either "buy" or "sell"',
      "any.required": "Operation is required",
    }),
    ticker: Joi.string()
      .uppercase()
      .trim()
      .pattern(/^[A-Z]{1,5}$/)
      .required()
      .messages({
        "string.pattern.base": "Ticker must be 1-5 uppercase letters",
        "any.required": "Stock ticker is required",
      }),
    price: Joi.number().positive().precision(2).required().messages({
      "number.positive": "Price must be positive",
      "any.required": "Price is required",
    }),
    papers: Joi.number().integer().positive().required().messages({
      "number.integer": "Number of shares must be a whole number",
      "number.positive": "Number of shares must be positive",
      "any.required": "Number of shares is required",
    }),
    executedAt: Joi.date().max("now").required().messages({
      "date.max": "Execution date cannot be in the future",
      "any.required": "Execution date is required",
    }),
  }),
};

// Export validation middleware functions
module.exports = {
  validate,
  // Auth validations
  registerValidation: validate(authSchemas.register),
  loginValidation: validate(authSchemas.login),
  profileUpdateValidation: validate(authSchemas.profileUpdate),
  // Transaction validations
  transactionValidation: validate(transactionSchemas.create),
};
