import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./TransactionsHistory.css";

function TransactionsHistory() {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // React Query for fetching transactions
  const {
    data: transactions = [],
    isLoading: loading,
    error,
    refetch: fetchTransactions,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      console.log("🌐 Fetching transactions from API...");
      const response = await transactionsAPI.getAll();
      console.log("📦 Received transactions:", response.data.length);
      return response.data;
    },
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const getTotalValue = (price, papers) => {
    return `$${(parseFloat(price) * parseInt(papers)).toFixed(2)}`;
  };

  // React Query mutation for deleting transactions
  const deleteMutation = useMutation({
    mutationFn: transactionsAPI.delete,
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries(["transactions"]);
      // Refresh user data
      refreshUser();
    },
    onError: (err) => {
      alert("Failed to delete transaction. Please try again.");
      console.error("Delete error:", err);
    },
  });

  const handleDelete = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    deleteMutation.mutate(transactionId);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1>Transactions History</h1>
        <div className="error-message">
          Failed to load transactions. Please try again.
        </div>
        <button onClick={fetchTransactions} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="transactions-header">
        <h1>Transactions History</h1>
        <p className="transactions-count">
          {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions found.</p>
          <p>Start by adding your first transaction on the Home page!</p>
        </div>
      ) : (
        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Operation</th>
                <th>Ticker</th>
                <th>Shares</th>
                <th>Price/Share</th>
                <th>Total Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{formatDate(transaction.executedAt)}</td>
                  <td>
                    <span
                      className={`operation-badge ${transaction.operation.toLowerCase()}`}
                    >
                      {transaction.operation.toUpperCase()}
                    </span>
                  </td>
                  <td className="ticker">{transaction.ticker}</td>
                  <td>{transaction.papers}</td>
                  <td>{formatPrice(transaction.price)}</td>
                  <td className="total-value">
                    {getTotalValue(transaction.price, transaction.papers)}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(transaction._id)}
                      className="delete-button"
                      title="Delete transaction"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionsHistory;
