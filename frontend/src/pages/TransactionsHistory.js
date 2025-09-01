import React, { useState } from "react";
import {
  useTransactions,
  useDeleteTransaction,
} from "../hooks/useTransactions";
import { SkeletonCard } from "../components/Skeleton";
import Pagination from "../components/Pagination";
import TransactionFilters from "../components/TransactionFilters";
import "./TransactionsHistory.css";

function TransactionsHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [pageSize] = useState(20);

  const {
    data: transactionsResponse,
    isLoading: loading,
    error,
    refetch: fetchTransactions,
  } = useTransactions(filters, currentPage, pageSize);

  // Extract transactions and pagination from response
  const transactions = transactionsResponse?.data || [];
  const pagination = transactionsResponse?.pagination;

  const deleteMutation = useDeleteTransaction();

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

  const handleDelete = (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    deleteMutation.mutate(transactionId);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return (
      <div className="page">
        <h1>Transactions History</h1>
        <div className="transactions-loading">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
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
          {pagination?.total || 0} transaction
          {(pagination?.total || 0) !== 1 ? "s" : ""}
        </p>
      </div>

      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No transactions found.</p>
          <p>Start by adding your first transaction on the Home page!</p>
        </div>
      ) : (
        <>
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
                        className={`operation-badge ${
                          transaction.operation === "buy"
                            ? "buy-operation"
                            : "sell-operation"
                        }`}
                      >
                        {transaction.operation.toUpperCase()}
                      </span>
                    </td>
                    <td className="ticker-cell">{transaction.ticker}</td>
                    <td>{transaction.papers}</td>
                    <td>{formatPrice(transaction.price)}</td>
                    <td>
                      {getTotalValue(transaction.price, transaction.papers)}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        className="delete-button"
                        title="Delete transaction"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          )}
        </>
      )}
    </div>
  );
}

export default TransactionsHistory;
