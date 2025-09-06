import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useBatchTransactions } from "../hooks/useTransactions";
import TransactionRow from "./TransactionRow";
import "./AddTransactionForm.css";

const AddTransactionForm = React.memo(({ onTransactionAdded }) => {
  const batchTransactionMutation = useBatchTransactions();
  const [transactionRows, setTransactionRows] = useState([
    {
      id: 1,
      operation: "buy",
      ticker: "",
      price: "",
      papers: "",
      executedAt: new Date().toISOString().split("T")[0],
    },
  ]);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm();

  // Add new transaction row
  const addTransactionRow = useCallback(() => {
    const newRow = {
      id: Date.now(),
      operation: "buy",
      ticker: "",
      price: "",
      papers: "",
      executedAt: new Date().toISOString().split("T")[0],
    };
    setTransactionRows((prevRows) => [...prevRows, newRow]);
  }, []);

  // Remove transaction row
  const removeTransactionRow = useCallback((id) => {
    setTransactionRows((prevRows) => {
      if (prevRows.length > 1) {
        return prevRows.filter((row) => row.id !== id);
      }
      return prevRows;
    });
  }, []);

  // Update transaction row
  const updateTransactionRow = useCallback((id, field, value) => {
    setTransactionRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }, []);

  // Validate transaction rows
  const validateTransactions = () => {
    const errors = [];

    transactionRows.forEach((row, index) => {
      if (!row.operation) {
        errors.push(`Transaction ${index + 1}: Operation is required`);
      }
      if (!row.ticker || !/^[A-Z]{1,5}$/.test(row.ticker)) {
        errors.push(`Transaction ${index + 1}: Valid ticker is required`);
      }
      if (!row.price || isNaN(row.price) || parseFloat(row.price) <= 0) {
        errors.push(`Transaction ${index + 1}: Valid price is required`);
      }
      if (!row.papers || isNaN(row.papers) || parseInt(row.papers) <= 0) {
        errors.push(
          `Transaction ${index + 1}: Valid number of shares is required`
        );
      }
      if (!row.executedAt) {
        errors.push(`Transaction ${index + 1}: Execution date is required`);
      }
    });

    return errors;
  };

  const onSubmit = async (data) => {
    try {
      // Validate transactions
      const validationErrors = validateTransactions();
      if (validationErrors.length > 0) {
        setError("root", {
          type: "validation",
          message: validationErrors.join(". "),
        });
        return;
      }

      // Process each transaction from transactionRows state
      const processedTransactions = transactionRows.map((transaction) => {
        const selectedDate = new Date(transaction.executedAt);
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

        return {
          ...transaction,
          ticker: transaction.ticker.toUpperCase(),
          price: parseFloat(transaction.price),
          papers: parseInt(transaction.papers),
          executedAt: executedAtWithTime.toISOString(),
        };
      });

      const response = await batchTransactionMutation.mutateAsync(
        processedTransactions
      );

      // Show success notification
      toast.success(
        `Successfully added ${processedTransactions.length} transaction${
          processedTransactions.length > 1 ? "s" : ""
        }!`
      );

      // Reset form on success
      setTransactionRows([
        {
          id: Date.now(),
          operation: "buy",
          ticker: "",
          price: "",
          papers: "",
          executedAt: new Date().toISOString().split("T")[0],
        },
      ]);
      reset();

      // Notify parent component if callback provided
      if (onTransactionAdded && response.data.data) {
        response.data.data.forEach((transaction) => {
          onTransactionAdded(transaction);
        });
      }
    } catch (err) {
      setError("root", {
        type: "server",
        message:
          err.response?.data?.error ||
          "Failed to add transactions. Please try again.",
      });
    }
  };

  return (
    <div className="add-transaction-form">
      <div className="form-header">
        <h3>Add Transactions</h3>
      </div>

      {errors.root && (
        <div className="message error-message">{errors.root.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="transactions-table">
          <div className="table-header">
            <div className="header-cell">#</div>
            <div className="header-cell">Operation</div>
            <div className="header-cell">Ticker</div>
            <div className="header-cell">Shares</div>
            <div className="header-cell">Price/Share</div>
            <div className="header-cell">Total Value</div>
            <div className="header-cell">Date</div>
            <div className="header-cell">Action</div>
          </div>

          <div className="transactions-container">
            {transactionRows.map((row, index) => (
              <TransactionRow
                key={row.id}
                index={index}
                row={row}
                onUpdate={updateTransactionRow}
                onRemove={removeTransactionRow}
                canRemove={transactionRows.length > 1}
                isLastRow={index === transactionRows.length - 1}
                onAddRow={addTransactionRow}
                canAddRow={transactionRows.length < 10}
              />
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || batchTransactionMutation.isPending}
            className="submit-button"
          >
            {isSubmitting || batchTransactionMutation.isPending
              ? "Adding Transactions..."
              : `Add ${transactionRows.length} Transaction${
                  transactionRows.length > 1 ? "s" : ""
                }`}
          </button>
        </div>
      </form>
    </div>
  );
});

AddTransactionForm.displayName = "AddTransactionForm";

export default AddTransactionForm;
