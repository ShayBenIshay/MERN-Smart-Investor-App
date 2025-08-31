const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const auth = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const {
  cacheTransactions,
  invalidateTransactionCache,
} = require("../middleware/cache");
const { transactionValidation } = require("../middleware/joiValidation");

const router = express.Router();

// Get user transactions
router.get(
  "/",
  auth,
  cacheTransactions,
  asyncHandler(async (req, res) => {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean() // Use lean for better performance on read-only operations
      .exec();
    res.json({
      success: true,
      data: transactions,
    });
  })
);

// Create transaction
router.post(
  "/",
  auth,
  transactionValidation,
  invalidateTransactionCache,
  asyncHandler(async (req, res) => {
    const { operation, executedAt, price, papers, ticker } = req.body;

    // Calculate transaction value
    const transactionValue = parseFloat(price) * parseInt(papers);

    // Create the transaction
    const transaction = new Transaction({
      operation,
      executedAt,
      price,
      papers,
      ticker,
      userId: req.user._id,
    });

    // Update user cash based on operation
    const user = await User.findById(req.user._id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (operation === "buy") {
      // Decrease cash when buying (allow negative balance)
      user.cash -= transactionValue;
    } else if (operation === "sell") {
      // Increase cash when selling
      user.cash += transactionValue;
    }

    // Save both transaction and user in sequence
    await transaction.save();
    await user.save();

    res.status(201).json({
      success: true,
      data: transaction,
    });
  })
);

// Get transaction by ID
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      const error = new Error("Transaction not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: transaction,
    });
  })
);

// Update transaction
router.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      const error = new Error("Transaction not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: transaction,
    });
  })
);

// Delete transaction
router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      const error = new Error("Transaction not found");
      error.statusCode = 404;
      throw error;
    }

    // Reverse the cash change
    const user = await User.findById(req.user._id);
    const transactionValue =
      parseFloat(transaction.price) * parseInt(transaction.papers);

    if (transaction.operation === "buy") {
      // Reverse buy: add cash back
      user.cash += transactionValue;
    } else if (transaction.operation === "sell") {
      // Reverse sell: subtract cash
      user.cash -= transactionValue;
    }

    // Delete transaction and save user cash update
    await Transaction.findByIdAndDelete(transaction._id);
    await user.save();

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  })
);

module.exports = router;
