import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { useAddTransaction } from "../hooks/useTransactions";
import { transactionsAPI } from "../services/api";
import "./AddTransactionForm.css";

// Custom hook for debounced price fetching
const useDebouncedPrice = (symbol, delay = 500) => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset state if symbol is too short
    if (!symbol || symbol.length < 2) {
      setPrice(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Set loading state
    setLoading(true);
    setError(null);

    // Create new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await transactionsAPI.getPrice(symbol.toUpperCase());
        console.log("API Response:", response.data); // Debug log
        setPrice(response.data.data.price); // Fixed: access data.data.price
        setError(null);
      } catch (err) {
        console.error("Price fetch error:", err); // Debug log
        setPrice(null);
        setError("Symbol not found");
      } finally {
        setLoading(false);
      }
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [symbol, delay]);

  return { price, loading, error };
};

// Validation schema
const transactionSchema = yup.object({
  operation: yup.string().required("Operation is required"),
  ticker: yup
    .string()
    .required("Stock ticker is required")
    .matches(/^[A-Z]{1,5}$/, "Ticker must be 1-5 uppercase letters"),
  price: yup
    .number()
    .typeError("Price must be a number")
    .positive("Price must be positive")
    .required("Price is required"),
  papers: yup
    .number()
    .typeError("Number of shares must be a number")
    .integer("Number of shares must be a whole number")
    .positive("Number of shares must be positive")
    .required("Number of shares is required"),
  executedAt: yup
    .date()
    .typeError("Please enter a valid date")
    .max(new Date(), "Date cannot be in the future")
    .required("Execution date is required"),
});

const AddTransactionForm = React.memo(({ onTransactionAdded }) => {
  const addTransactionMutation = useAddTransaction();
  const [tickerValue, setTickerValue] = useState("");
  const { price, loading, error } = useDebouncedPrice(tickerValue);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(transactionSchema),
    defaultValues: {
      operation: "buy",
      ticker: "",
      price: "",
      papers: "",
      executedAt: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    },
  });

  // Watch the ticker field for changes
  const watchedTicker = watch("ticker");

  // Update local state when form ticker changes
  useEffect(() => {
    setTickerValue(watchedTicker || "");
  }, [watchedTicker]);

  // Auto-fill price when real-time price is available
  useEffect(() => {
    if (price && !watchedTicker) {
      setValue("price", price.toFixed(2));
    }
  }, [price, setValue, watchedTicker]);

  const onSubmit = async (data) => {
    try {
      // Combine selected date with current time (hours, minutes, seconds)
      const selectedDate = new Date(data.executedAt);
      const currentTime = new Date();

      // Create new date with selected date but current time
      const executedAtWithTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        currentTime.getHours(),
        currentTime.getMinutes(),
        currentTime.getSeconds(),
        currentTime.getMilliseconds()
      );

      const transactionData = {
        ...data,
        ticker: data.ticker.toUpperCase(),
        price: parseFloat(data.price),
        papers: parseInt(data.papers),
        executedAt: executedAtWithTime.toISOString(),
      };

      const response = await addTransactionMutation.mutateAsync(
        transactionData
      );

      // Show success notification
      toast.success("Transaction added successfully!");

      // Reset form on success
      reset();
      setTickerValue("");

      // Notify parent component if callback provided
      if (onTransactionAdded) {
        onTransactionAdded(response.data.data);
      }
    } catch (err) {
      setError("root", {
        type: "server",
        message:
          err.response?.data?.error ||
          "Failed to add transaction. Please try again.",
      });
    }
  };

  return (
    <div className="add-transaction-form">
      <h3>Add New Transaction</h3>

      {errors.root && (
        <div className="message error-message">{errors.root.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="operation">Operation *</label>
            <select id="operation" {...register("operation")}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            {errors.operation && (
              <span className="error-text">{errors.operation.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ticker">Stock Ticker *</label>
            <div className="ticker-input-container">
              <input
                type="text"
                id="ticker"
                {...register("ticker")}
                placeholder="e.g., AAPL, TSLA"
                style={{ textTransform: "uppercase" }}
              />
              {/* Real-time price display */}
              <div className="price-display">
                {loading && (
                  <span className="price-loading">
                    <span className="spinner"></span>
                    Loading price...
                  </span>
                )}
                {price && !loading && (
                  <span className="current-price">
                    Current: ${price.toFixed(2)}
                  </span>
                )}
                {error && !loading && (
                  <span className="price-error">{error}</span>
                )}
              </div>
            </div>
            {errors.ticker && (
              <span className="error-text">{errors.ticker.message}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price per Share *</label>
            <input
              type="number"
              id="price"
              {...register("price")}
              placeholder={price ? price.toFixed(2) : "0.00"}
              step="0.01"
              min="0.01"
            />
            {errors.price && (
              <span className="error-text">{errors.price.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="papers">Number of Shares *</label>
            <input
              type="number"
              id="papers"
              {...register("papers")}
              placeholder="1"
              min="1"
            />
            {errors.papers && (
              <span className="error-text">{errors.papers.message}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="executedAt">Execution Date *</label>
          <input type="date" id="executedAt" {...register("executedAt")} />
          {errors.executedAt && (
            <span className="error-text">{errors.executedAt.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || addTransactionMutation.isPending}
          className="submit-button"
        >
          {isSubmitting || addTransactionMutation.isPending
            ? "Adding Transaction..."
            : "Add Transaction"}
        </button>
      </form>
    </div>
  );
});

AddTransactionForm.displayName = "AddTransactionForm";

export default AddTransactionForm;
