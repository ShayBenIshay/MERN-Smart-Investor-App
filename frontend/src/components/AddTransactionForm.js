import React, { useState } from "react";
import { transactionsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AddTransactionForm.css";

function AddTransactionForm({ onTransactionAdded }) {
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    operation: "buy",
    ticker: "",
    price: "",
    papers: "",
    executedAt: new Date().toISOString().slice(0, 10), // Current date in YYYY-MM-DD format
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear messages when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (!formData.ticker || !formData.price || !formData.papers) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Validate numeric fields
      if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
        setError("Please enter a valid price");
        setLoading(false);
        return;
      }

      if (isNaN(formData.papers) || parseInt(formData.papers) <= 0) {
        setError("Please enter a valid number of shares");
        setLoading(false);
        return;
      }

      const transactionData = {
        ...formData,
        price: parseFloat(formData.price),
        papers: parseInt(formData.papers),
        executedAt: new Date(formData.executedAt).toISOString(),
      };

      const response = await transactionsAPI.create(transactionData);

      setSuccess("Transaction added successfully!");

      // Reset form
      setFormData({
        operation: "buy",
        ticker: "",
        price: "",
        papers: "",
        executedAt: new Date().toISOString().slice(0, 10),
      });

      // Refresh user cash after transaction
      await refreshUser();

      // Notify parent component if callback provided
      if (onTransactionAdded) {
        onTransactionAdded(response.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to add transaction. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-transaction-form">
      <h3>Add New Transaction</h3>

      {error && <div className="message error-message">{error}</div>}
      {success && <div className="message success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="operation">Operation *</label>
            <select
              id="operation"
              name="operation"
              value={formData.operation}
              onChange={handleChange}
              required
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ticker">Stock Ticker *</label>
            <input
              type="text"
              id="ticker"
              name="ticker"
              value={formData.ticker}
              onChange={handleChange}
              placeholder="e.g., AAPL, TSLA"
              required
              style={{ textTransform: "uppercase" }}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price per Share *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="papers">Number of Shares *</label>
            <input
              type="number"
              id="papers"
              name="papers"
              value={formData.papers}
              onChange={handleChange}
              placeholder="1"
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="executedAt">Execution Date *</label>
          <input
            type="date"
            id="executedAt"
            name="executedAt"
            value={formData.executedAt}
            onChange={(e) => {
              handleChange(e);
              e.target.blur(); // Close picker after selection
            }}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? "Adding Transaction..." : "Add Transaction"}
        </button>
      </form>
    </div>
  );
}

export default AddTransactionForm;
