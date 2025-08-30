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
      type: Number,
      required: true,
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
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
