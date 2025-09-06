const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Holding = require("../models/Holding");
const auth = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const {
  cacheTransactions,
  invalidateTransactionCache,
  invalidateUserCache,
} = require("../middleware/cache");
const cacheService = require("../services/cacheService");
const {
  transactionValidation,
  batchTransactionValidation,
  handleValidationErrors,
} = require("../middleware/validation");
const mongoose = require("mongoose");

// Helper function to invalidate holdings for specific tickers
const invalidateHoldingsForTickers = async (userId, tickers) => {
  try {
    await Holding.updateMany(
      {
        userId,
        ticker: { $in: tickers.map((t) => t.toUpperCase()) },
      },
      {
        lastSyncedAt: null,
      }
    );
    console.log(`Invalidated holdings for tickers: ${tickers.join(", ")}`);
  } catch (error) {
    console.error("Error invalidating holdings:", error);
  }
};

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

    if (ticker)
      filter.ticker = { $regex: `^${ticker.toUpperCase()}`, $options: "i" };
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

    let transactions;

    if (sortBy === "price") {
      // Sort by total value (price * papers), not price/share
      const sortDirection = sortOrder === "desc" ? -1 : 1;
      transactions = await Transaction.aggregate([
        { $match: filter },
        { $addFields: { priceNum: { $toDouble: "$price" } } },
        {
          $addFields: {
            totalValueNum: { $multiply: ["$papers", "$priceNum"] },
          },
        },
        { $sort: { totalValueNum: sortDirection } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $project: { priceNum: 0, totalValueNum: 0 } },
      ]).exec();
    } else {
      // Execute query with pagination
      transactions = await Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean()
        .exec();
    }

    // Normalize Decimal128 price to number to avoid NaN on client
    const normalizedTransactions = transactions.map((t) => {
      let normalizedPrice = t.price;
      if (t.price != null) {
        if (typeof t.price === "object") {
          const decimalString =
            (t.price && t.price.$numberDecimal) ||
            (typeof t.price.toString === "function"
              ? t.price.toString()
              : null);
          normalizedPrice =
            decimalString != null ? parseFloat(decimalString) : t.price;
        }
      }
      return { ...t, price: normalizedPrice };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: normalizedTransactions,
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

    // Convert to Decimal128 for storage and use numeric math for calculations
    const priceDecimal = new mongoose.Types.Decimal128(
      parseFloat(price).toFixed(2)
    );
    const papersInt = parseInt(papers);
    const transactionValue = new mongoose.Types.Decimal128(
      (parseFloat(price) * papersInt).toFixed(2)
    );

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

      // Invalidate holdings for this ticker
      await invalidateHoldingsForTickers(req.user._id, [ticker]);

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

// Get all transactions without pagination (for portfolio calculations)
router.get(
  "/all",
  auth,
  asyncHandler(async (req, res) => {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ executedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: transactions,
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
    // Get the original transaction to check if ticker changed
    const originalTransaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!originalTransaction) {
      const error = new Error("Transaction not found");
      error.statusCode = 404;
      throw error;
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    // Invalidate holdings for both old and new tickers
    const tickersToInvalidate = [originalTransaction.ticker];
    if (req.body.ticker && req.body.ticker !== originalTransaction.ticker) {
      tickersToInvalidate.push(req.body.ticker);
    }
    await invalidateHoldingsForTickers(req.user._id, tickersToInvalidate);

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

      // Invalidate holdings for this ticker
      await invalidateHoldingsForTickers(req.user._id, [transaction.ticker]);

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

// Update the price route to fetch dynamically
router.get(
  "/prices/:symbol",
  auth,
  asyncHandler(async (req, res) => {
    const { symbol } = req.params;
    const alpacaPrices = require("../services/alpacaPrices");

    // Use the async method to fetch price if not cached
    const price = await alpacaPrices.getPriceAsync(symbol.toUpperCase());

    res.json({
      success: true,
      data: { symbol: symbol.toUpperCase(), price },
    });
  })
);

// Update the test route
// router.get(
//   "/prices/test/:symbol",
//   auth,
//   asyncHandler(async (req, res) => {
//     const { symbol } = req.params;
//     const alpacaPrices = require("../services/alpacaPrices");
//     const price = alpacaPrices.getPrice(symbol.toUpperCase());
//     const allPrices = alpacaPrices.getAllPrices();
//     const status = alpacaPrices.getConnectionStatus();

//     res.json({
//       success: true,
//       data: {
//         symbol: symbol.toUpperCase(),
//         price,
//         allPrices,
//         status,
//       },
//     });
//   })
// );

// Add this test route to check credentials
// router.get(
//   "/prices/debug",
//   auth,
//   asyncHandler(async (req, res) => {
//     const config = require("../config/config");
//     const currentConfig = config[process.env.NODE_ENV || "development"];

//     res.json({
//       success: true,
//       data: {
//         hasApiKey: !!currentConfig.alpaca.apiKey,
//         apiKeyPreview: currentConfig.alpaca.apiKey
//           ? currentConfig.alpaca.apiKey.substring(0, 8) + "..."
//           : "No API key",
//         hasSecretKey: !!currentConfig.alpaca.secretKey,
//         secretKeyPreview: currentConfig.alpaca.secretKey
//           ? currentConfig.alpaca.secretKey.substring(0, 8) + "..."
//           : "No secret key",
//         environment: process.env.NODE_ENV || "development",
//       },
//     });
//   })
// );

// Add this new endpoint
router.post(
  "/prices/subscribe-portfolio",
  auth,
  asyncHandler(async (req, res) => {
    const { symbols } = req.body;
    const alpacaPrices = require("../services/alpacaPrices");

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: "Symbols array is required",
      });
    }

    // Subscribe to new symbols
    alpacaPrices.subscribeToPortfolio(symbols);

    res.json({
      success: true,
      message: `Subscribed to ${symbols.length} symbols`,
      subscribedSymbols: Array.from(alpacaPrices.subscribedSymbols),
    });
  })
);

// Create multiple transactions in batch
router.post(
  "/batch",
  auth,
  batchTransactionValidation,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { transactions } = req.body;
    const userId = req.user._id;

    // Validation is handled by middleware

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Prepare transactions with userId (remove frontend id field)
      const transactionsToCreate = transactions.map((transaction) => {
        const { id, ...transactionData } = transaction; // Remove the frontend id
        return {
          ...transactionData,
          userId,
          ticker: transaction.ticker.toUpperCase(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      // Create all transactions
      const createdTransactions = await Transaction.insertMany(
        transactionsToCreate,
        { session }
      );

      // Update user's cash balance
      let totalCashChange = 0;
      const tickers = new Set();

      for (const transaction of createdTransactions) {
        const cashChange =
          transaction.operation === "buy"
            ? -(transaction.price * transaction.papers)
            : transaction.price * transaction.papers;
        totalCashChange += cashChange;
        tickers.add(transaction.ticker);
      }

      await User.findByIdAndUpdate(
        userId,
        { $inc: { cash: totalCashChange } },
        { session }
      );

      // Invalidate holdings for affected tickers
      await invalidateHoldingsForTickers(userId, Array.from(tickers));

      // Invalidate caches
      cacheService.invalidateTransactionsCache(userId);
      cacheService.invalidateUserCache(userId);

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: `Successfully created ${createdTransactions.length} transactions`,
        data: createdTransactions,
        cashChange: totalCashChange,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Batch transaction error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create transactions",
        message: error.message,
      });
    } finally {
      session.endSession();
    }
  })
);

module.exports = router;
