const express = require("express");
const Holding = require("../models/Holding");
const auth = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Get all holdings for a user
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const holdings = await Holding.find({ userId: req.user._id });
    res.json({ success: true, data: holdings });
  })
);

// Create or update holdings from portfolio data
router.post(
  "/sync",
  auth,
  asyncHandler(async (req, res) => {
    const { holdings } = req.body;

    if (!holdings || !Array.isArray(holdings)) {
      return res.status(400).json({
        success: false,
        message: "Holdings array is required",
      });
    }

    const userId = req.user._id;
    const results = [];
    const now = new Date();

    for (const holdingData of holdings) {
      const {
        symbol,
        totalShares,
        averagePrice,
        totalSpent,
        totalValue,
        lastPrice,
      } = holdingData;

      if (!symbol || totalShares <= 0) continue;

      const holding = await Holding.findOneAndUpdate(
        { userId, ticker: symbol.toUpperCase() },
        {
          ticker: symbol.toUpperCase(),
          totalShares: totalShares || 0,
          averagePrice: averagePrice || 0,
          totalSpent: totalSpent || 0,
          totalValue: totalValue || 0,
          lastPrice: lastPrice || 0,
          lastSyncedAt: now,
        },
        { new: true, upsert: true }
      );

      results.push(holding);
    }

    res.json({ success: true, data: results });
  })
);

// Invalidate holdings for specific tickers (called when transactions change)
router.post(
  "/invalidate",
  auth,
  asyncHandler(async (req, res) => {
    const { tickers } = req.body;
    const userId = req.user._id;

    if (!tickers || !Array.isArray(tickers)) {
      return res.status(400).json({
        success: false,
        message: "Tickers array is required",
      });
    }

    // Mark holdings as invalidated by setting lastSyncedAt to null
    const result = await Holding.updateMany(
      {
        userId,
        ticker: { $in: tickers.map((t) => t.toUpperCase()) },
      },
      {
        lastSyncedAt: null,
      }
    );

    res.json({
      success: true,
      message: `Invalidated ${result.modifiedCount} holdings`,
      modifiedCount: result.modifiedCount,
    });
  })
);

// Update a holding
router.put(
  "/:ticker",
  auth,
  asyncHandler(async (req, res) => {
    const { stopLoss, entryReason } = req.body;
    const holding = await Holding.findOneAndUpdate(
      { userId: req.user._id, ticker: req.params.ticker.toUpperCase() },
      { stopLoss: stopLoss || 0, entryReason: entryReason || "" },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: holding });
  })
);

module.exports = router;
