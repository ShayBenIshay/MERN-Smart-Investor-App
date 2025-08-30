const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Get user transactions
router.get("/", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post("/", auth, async (req, res) => {
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
      return res.status(404).json({ error: "User not found" });
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

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transaction by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
router.put("/:id", auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete transaction
router.delete("/:id", auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
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

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
