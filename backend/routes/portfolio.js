const express = require("express");
const Holding = require("../models/Holding");
const auth = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Get portfolio for a specific user
router.get(
  "/:userId",
  auth,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Verify the user can only access their own portfolio
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own portfolio.",
      });
    }

    const holdings = await Holding.find({ userId });
    res.json({ success: true, data: holdings });
  })
);

// Sync portfolio for a specific user
router.post(
  "/:userId/sync",
  auth,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { holdings } = req.body;

    // Verify the user can only sync their own portfolio
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only sync your own portfolio.",
      });
    }

    if (!holdings || !Array.isArray(holdings)) {
      return res.status(400).json({
        success: false,
        message: "Holdings array is required",
      });
    }

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

// Invalidate portfolio for a specific user
router.post(
  "/:userId/invalidate",
  auth,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { tickers } = req.body;

    // Verify the user can only invalidate their own portfolio
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only invalidate your own portfolio.",
      });
    }

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

// Update a specific holding in user's portfolio
router.put(
  "/:userId/holdings/:ticker",
  auth,
  asyncHandler(async (req, res) => {
    const { userId, ticker } = req.params;
    const { stopLoss, entryReason } = req.body;

    // Verify the user can only update their own portfolio
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own portfolio.",
      });
    }

    const holding = await Holding.findOneAndUpdate(
      { userId, ticker: ticker.toUpperCase() },
      { stopLoss: stopLoss || 0, entryReason: entryReason || "" },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: holding });
  })
);

module.exports = router;
