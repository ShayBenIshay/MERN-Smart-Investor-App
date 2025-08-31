const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  transactionValidation,
  handleValidationErrors,
} = require("../middleware/validation");

const router = express.Router();

// Get user transactions
router.get("/", auth, async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
});

// Create transaction
router.post(
  "/",
  auth,
  transactionValidation,
  handleValidationErrors,
  async (req, res, next) => {
    try {
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
    } catch (error) {
      next(error);
    }
  }
);

// Get transaction by ID
router.get("/:id", auth, async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// Update transaction
router.put("/:id", auth, async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// Delete transaction
router.delete("/:id", auth, async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

module.exports = router;
