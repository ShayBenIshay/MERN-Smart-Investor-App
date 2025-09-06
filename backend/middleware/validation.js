const { body, validationResult } = require("express-validator");

// Validation rules
const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("cash")
    .optional()
    .isNumeric()
    .withMessage("Cash must be a number")
    .isFloat({ min: 0 })
    .withMessage("Cash cannot be negative"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const transactionValidation = [
  body("operation")
    .isIn(["buy", "sell"])
    .withMessage("Operation must be either buy or sell"),
  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be greater than 0"),
  body("papers")
    .isInt({ min: 1 })
    .withMessage("Papers must be a positive integer"),
  body("ticker")
    .isLength({ min: 1, max: 10 })
    .withMessage("Ticker must be between 1 and 10 characters")
    .isAlphanumeric()
    .withMessage("Ticker must contain only letters and numbers"),
  body("executedAt").isISO8601().withMessage("ExecutedAt must be a valid date"),
];

const batchTransactionValidation = [
  body("transactions")
    .isArray({ min: 1, max: 10 })
    .withMessage("Transactions must be an array with 1-10 items"),
  body("transactions.*.operation")
    .isIn(["buy", "sell"])
    .withMessage("Each transaction operation must be either buy or sell"),
  body("transactions.*.price")
    .isNumeric()
    .withMessage("Each transaction price must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Each transaction price must be greater than 0"),
  body("transactions.*.papers")
    .isInt({ min: 1 })
    .withMessage("Each transaction papers must be a positive integer"),
  body("transactions.*.ticker")
    .isLength({ min: 1, max: 10 })
    .withMessage("Each transaction ticker must be between 1 and 10 characters")
    .isAlphanumeric()
    .withMessage(
      "Each transaction ticker must contain only letters and numbers"
    ),
  body("transactions.*.executedAt")
    .isISO8601()
    .withMessage("Each transaction executedAt must be a valid date"),
];

const profileUpdateValidation = [
  body("firstName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("cash").optional().isNumeric().withMessage("Cash must be a number"),
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  transactionValidation,
  batchTransactionValidation,
  profileUpdateValidation,
  handleValidationErrors,
};
