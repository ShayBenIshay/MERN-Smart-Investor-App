const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const auth = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const {
  cacheTransactions,
  invalidateTransactionCache,
  invalidateUserCache,
} = require("../middleware/cache");
const { transactionValidation } = require("../middleware/joiValidation");
const mongoose = require("mongoose");

const router = express.Router();

// Get user transactions with pagination and filters
router.get(
  "/",
  auth,
  cacheTransactions,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      ticker,
      operation,
      startDate,
      endDate,
      sortBy = "executedAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = { userId: req.user._id };

    if (ticker) filter.ticker = ticker.toUpperCase();
    if (operation) filter.operation = operation;
    if (startDate || endDate) {
      filter.executedAt = {};
      if (startDate) filter.executedAt.$gte = new Date(startDate);
      if (endDate) filter.executedAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transaction.countDocuments(filter);

    // Execute query with pagination
    const transactions = await Transaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .exec();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? parseInt(page) + 1 : null,
        prevPage: hasPrevPage ? parseInt(page) - 1 : null,
      },
    });
  })
);

// Create transaction
router.post(
  "/",
  auth,
  transactionValidation,
  invalidateTransactionCache,
  invalidateUserCache,
  asyncHandler(async (req, res) => {
    const { operation, executedAt, price, papers, ticker } = req.body;

    // Convert to Decimal128 for precise calculations
    const priceDecimal = new mongoose.Types.Decimal128(price.toString());
    const papersInt = parseInt(papers);
    const transactionValue = priceDecimal.mul(papersInt);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = new Transaction({
        operation,
        executedAt,
        price: priceDecimal,
        papers: papersInt,
        ticker,
        userId: req.user._id,
      });

      const user = await User.findById(req.user._id).session(session);
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      if (operation === "buy") {
        user.cash = new mongoose.Types.Decimal128(
          (parseFloat(user.cash) - parseFloat(transactionValue)).toFixed(2)
        );
      } else if (operation === "sell") {
        user.cash = new mongoose.Types.Decimal128(
          (parseFloat(user.cash) + parseFloat(transactionValue)).toFixed(2)
        );
      }

      await transaction.save({ session });
      await user.save({ session });

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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
  invalidateTransactionCache,
  invalidateUserCache,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const error = new Error("Invalid transaction ID format");
      error.statusCode = 400;
      throw error;
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!transaction) {
      const error = new Error(
        "Transaction not found or doesn't belong to user"
      );
      error.statusCode = 404;
      throw error;
    }

    const transactionValue = new mongoose.Types.Decimal128(
      (parseFloat(transaction.price) * transaction.papers).toFixed(2)
    );

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(req.user._id).session(session);

      if (transaction.operation === "buy") {
        user.cash = new mongoose.Types.Decimal128(
          (parseFloat(user.cash) + parseFloat(transactionValue)).toFixed(2)
        );
      } else if (transaction.operation === "sell") {
        user.cash = new mongoose.Types.Decimal128(
          (parseFloat(user.cash) - parseFloat(transactionValue)).toFixed(2)
        );
      }

      await Transaction.findByIdAndDelete(transaction._id).session(session);
      await user.save({ session });

      await session.commitTransaction();

      res.json({
        success: true,
        message: "Transaction deleted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  })
);

module.exports = router;
