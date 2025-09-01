const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    operation: {
      type: String,
      required: true,
      enum: ["buy", "sell"],
    },
    executedAt: {
      type: Date,
      required: true,
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => parseFloat(v),
      set: (v) => v.toFixed(2),
    },
    papers: {
      type: Number,
      required: true,
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Database indexes for performance
transactionSchema.index({ userId: 1, createdAt: -1 }); // Primary query pattern
transactionSchema.index({ ticker: 1, executedAt: -1 }); // For ticker analysis
transactionSchema.index({ userId: 1, ticker: 1 }); // User's specific stock transactions
transactionSchema.index({ operation: 1, executedAt: -1 }); // For operation-based analytics

module.exports = mongoose.model("Transaction", transactionSchema);
