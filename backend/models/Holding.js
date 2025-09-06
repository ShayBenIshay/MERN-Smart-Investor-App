const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true,
    },
    // Calculated portfolio data
    totalShares: {
      type: Number,
      default: 0,
    },
    averagePrice: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    totalValue: {
      type: Number,
      default: 0,
    },
    lastPrice: {
      type: Number,
      default: 0,
    },
    // Portfolio metadata
    stopLoss: {
      type: Number,
      default: 0,
    },
    entryReason: {
      type: String,
      default: "",
    },
    // Sync tracking
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one holding per user per ticker
holdingSchema.index({ userId: 1, ticker: 1 }, { unique: true });

module.exports = mongoose.model("Holding", holdingSchema);
