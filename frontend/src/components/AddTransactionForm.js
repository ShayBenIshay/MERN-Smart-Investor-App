import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { useAddTransaction } from "../hooks/useTransactions";
import "./AddTransactionForm.css";

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm({
    resolver: yupResolver(transactionSchema),
    defaultValues: {
      operation: "buy",
      ticker: "",
      price: "",
      papers: "",
      executedAt: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (data) => {
    try {
      const transactionData = {
        ...data,
        ticker: data.ticker.toUpperCase(),
        price: parseFloat(data.price),
        papers: parseInt(data.papers),
        executedAt: new Date(data.executedAt).toISOString(),
      };

      const response = await addTransactionMutation.mutateAsync(
        transactionData
      );

      // Show success notification
      toast.success("Transaction added successfully!");

      // Reset form on success
      reset();

      // Notify parent component if callback provided
      if (onTransactionAdded) {
        onTransactionAdded(response.data);
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
            <input
              type="text"
              id="ticker"
              {...register("ticker")}
              placeholder="e.g., AAPL, TSLA"
              style={{ textTransform: "uppercase" }}
            />
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
              placeholder="0.00"
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
