import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useTransactions,
  useDeleteTransaction,
} from "../hooks/useTransactions";
import { SkeletonCard } from "../components/Skeleton";
import Pagination from "../components/Pagination";
import TransactionFilters from "../components/TransactionFilters";
import "./TransactionsHistory.css";

function TransactionsHistory() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL query params so filters persist across refresh
  const initialFilters = useMemo(() => {
    const get = (key) => searchParams.get(key) || "";
    return {
      ticker: get("ticker"),
      operation: get("operation"),
      startDate: get("startDate"),
      endDate: get("endDate"),
      sortBy: get("sortBy") || "executedAt",
      sortOrder: get("sortOrder") || "desc",
    };
  }, [searchParams]);

  const initialPage = useMemo(() => {
    const pageParam = searchParams.get("page");
    const parsed = pageParam ? parseInt(pageParam, 10) : 1;
    return Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [searchParams]);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [filters, setFilters] = useState(initialFilters);

  // Keep local state in sync if URL changes (e.g., back/forward navigation)
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);
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
    setFilters((prev) => {
      const next = { ...prev, [filterName]: value };

      // Update URL search params
      const newParams = new URLSearchParams(searchParams);
      Object.entries({ ...next, page: 1 }).forEach(([key, v]) => {
        if (v == null || v === "") newParams.delete(key);
        else newParams.set(key, v);
      });
      setSearchParams(newParams, { replace: false });

      return next;
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
    // Clear only known filter keys from URL and reset page
    const newParams = new URLSearchParams(searchParams);
    [
      "ticker",
      "operation",
      "startDate",
      "endDate",
      "sortBy",
      "sortOrder",
      "page",
    ].forEach((k) => newParams.delete(k));
    setSearchParams(newParams, { replace: false });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    if (newPage && newPage > 1) newParams.set("page", String(newPage));
    else newParams.delete("page");
    setSearchParams(newParams, { replace: false });
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
