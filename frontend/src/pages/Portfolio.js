import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { usePortfolio } from "../hooks/usePortfolio";
import { PortfolioTableSkeleton } from "../components/Skeleton";
import { portfolioAPI } from "../services/api";
import "./Portfolio.css";

// Memoized Portfolio Row Component - moved outside to avoid Rules of Hooks violation
const PortfolioRow = React.memo(
  ({
    holding,
    editedHoldings,
    handleInputChange,
    formatCurrency,
    formatPercent,
    collapsibleColumns,
    isColumnVisible,
  }) => (
    <tr key={holding.symbol} className="portfolio-row">
      <td className="symbol">{holding.symbol}</td>
      <td>{formatCurrency(holding.avgBuyPrice)}</td>
      {collapsibleColumns.map((columnKey) =>
        isColumnVisible(columnKey) ? (
          <td key={columnKey}>
            {columnKey === "position" && holding.position.toLocaleString()}
            {columnKey === "totalSpent" && formatCurrency(holding.totalSpent)}
            {columnKey === "totalValue" && formatCurrency(holding.totalValue)}
          </td>
        ) : (
          <td key={columnKey} className="collapsed-cell">
            <div className="collapsed-data">•</div>
          </td>
        )
      )}
      <td>
        <input
          type="number"
          step="0.01"
          min="0"
          value={editedHoldings[holding.symbol]?.stopLoss || 0}
          onChange={(e) =>
            handleInputChange(holding.symbol, "stopLoss", e.target.value)
          }
          className="editable-input currency-input"
        />
      </td>
      <td>
        <span className={holding.riskDollar > 0 ? "negative" : ""}>
          {holding.riskDollar > 0 ? formatCurrency(holding.riskDollar) : "-"}
        </span>
      </td>
      <td>
        <span className={holding.riskPercent > 0 ? "negative" : ""}>
          {holding.riskPercent > 0 ? formatPercent(holding.riskPercent) : "-"}
        </span>
      </td>
      <td>{formatCurrency(holding.lastPrice)}</td>
      <td>
        <input
          type="text"
          value={editedHoldings[holding.symbol]?.entryReason || ""}
          onChange={(e) =>
            handleInputChange(holding.symbol, "entryReason", e.target.value)
          }
          className="editable-input text-input"
        />
      </td>
      <td className={holding.unrealizedPL >= 0 ? "positive" : "negative"}>
        {formatCurrency(holding.unrealizedPL)}
      </td>
      <td
        className={holding.unrealizedPLPercent >= 0 ? "positive" : "negative"}
      >
        {formatPercent(holding.unrealizedPLPercent)}
      </td>
      <td>{formatPercent(holding.totalPercent)}</td>
    </tr>
  )
);

function Portfolio() {
  const queryClient = useQueryClient();
  const { userId } = useParams();

  console.log("Portfolio component - userId from params:", userId);
  console.log("Portfolio component - current URL:", window.location.pathname);

  const {
    holdings,
    totalSpent,
    totalValue,
    unrealizedPL,
    unrealizedPLPercent,
    isLoading,
    error,
    isSyncing,
  } = usePortfolio(userId);

  // State for editable values
  const [editedHoldings, setEditedHoldings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // State for collapsed columns - start with all columns collapsed by default
  const [collapsedColumns, setCollapsedColumns] = useState(
    new Set(["position", "totalSpent", "totalValue"])
  );

  // Initialize edited holdings when data loads
  useEffect(() => {
    if (holdings.length > 0) {
      console.log("Initializing edited holdings with:", holdings);
      const initialValues = {};
      holdings.forEach((holding) => {
        initialValues[holding.symbol] = {
          stopLoss: holding.stopLoss || 0,
          entryReason: holding.entryReason || "",
        };
      });
      console.log("Initial values set:", initialValues);
      setEditedHoldings(initialValues);
    }
  }, [holdings]);

  // Handle input changes - memoized to prevent re-renders
  const handleInputChange = useCallback((symbol, field, value) => {
    setEditedHoldings((prev) => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        [field]: field === "stopLoss" ? parseFloat(value) || 0 : value,
      },
    }));
    setHasChanges(true);
  }, []);

  // Handle update - memoized to prevent re-renders
  const handleUpdate = useCallback(async () => {
    if (isUpdating || !userId) return;

    setIsUpdating(true);
    try {
      const updatePromises = Object.entries(editedHoldings).map(
        ([symbol, data]) => portfolioAPI.updateHolding(userId, symbol, data)
      );

      await Promise.all(updatePromises);
      setHasChanges(false);

      // Invalidate portfolio query to trigger recalculation of risk metrics
      await queryClient.invalidateQueries({ queryKey: ["portfolio", userId] });

      console.log("Portfolio updated successfully");
      alert("Portfolio updated successfully!");
    } catch (error) {
      console.error("Error updating portfolio:", error);
      alert("Error updating portfolio. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }, [editedHoldings, isUpdating, queryClient, userId]);

  // Toggle collapse/expand for a column - memoized
  const toggleColumnCollapse = useCallback((columnKey) => {
    setCollapsedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  }, []);

  // Memoized utility functions to prevent recreation on every render
  const formatCurrency = useCallback(
    (value) =>
      `$${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    []
  );

  const formatPercent = useCallback((value) => `${value.toFixed(2)}%`, []);

  // Memoized collapsible columns configuration
  const collapsibleColumns = useMemo(
    () => ["position", "totalSpent", "totalValue"],
    []
  );

  // Helper function to check if column is visible - memoized
  const isColumnVisible = useCallback(
    (columnKey) => !collapsedColumns.has(columnKey),
    [collapsedColumns]
  );

  // Get abbreviated column titles for collapsed state - memoized
  const getColumnAbbreviation = useCallback((columnKey) => {
    const abbreviations = {
      avgBuyPrice: "Avg",
      position: "Pos",
      lastPrice: "Last",
      totalSpent: "Spent",
      totalValue: "Value",
      stopLoss: "Stop",
      riskDollar: "Risk$",
      riskPercent: "Risk%",
      entryReason: "Note",
    };
    return abbreviations[columnKey] || columnKey.slice(0, 3);
  }, []);

  // Toggle all columns collapse/expand - memoized
  const toggleAllColumns = useCallback(() => {
    if (collapsedColumns.size === 0) {
      // Collapse all
      setCollapsedColumns(new Set(collapsibleColumns));
    } else {
      // Expand all
      setCollapsedColumns(new Set());
    }
  }, [collapsedColumns.size, collapsibleColumns]);

  if (isLoading) {
    return (
      <div className="page">
        <h1>Your Portfolio</h1>
        <PortfolioTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-state">
          <h1>Unable to Load Portfolio</h1>
          <p>
            There was an error loading your portfolio data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Your Portfolio</h1>

      {holdings.length > 0 ? (
        <div className="portfolio-container">
          <div className="portfolio-controls">
            {isSyncing && (
              <div className="sync-indicator">🔄 Syncing holdings...</div>
            )}
            <button onClick={toggleAllColumns} className="toggle-all-button">
              {collapsedColumns.size === 0 ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {hasChanges && (
            <div className="update-controls">
              <button onClick={handleUpdate} className="update-button">
                Update Portfolio
              </button>
              <span className="changes-indicator">• Unsaved changes</span>
            </div>
          )}
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Avg Buy Price</th>
                {collapsibleColumns.map((columnKey) =>
                  isColumnVisible(columnKey) ? (
                    <th
                      key={columnKey}
                      className="collapsible-header"
                      onClick={() => toggleColumnCollapse(columnKey)}
                    >
                      <span className="collapse-icon">▼</span>
                      {columnKey === "position" && "Position"}
                      {columnKey === "totalSpent" && "Total Spent"}
                      {columnKey === "totalValue" && "Total Value"}
                    </th>
                  ) : (
                    <th
                      key={columnKey}
                      className="collapsed-header"
                      onClick={() => toggleColumnCollapse(columnKey)}
                    >
                      <div className="collapsed-title">
                        <span className="collapse-icon">▶</span>
                        <div className="abbreviated-title">
                          {getColumnAbbreviation(columnKey)}
                        </div>
                      </div>
                    </th>
                  )
                )}
                <th>Stop Loss $</th>
                <th>Risk $</th>
                <th>Risk %</th>
                <th>Last Price</th>
                <th>Entry Reason</th>
                <th>Unrealized P&L $</th>
                <th>Unrealized P&L %</th>
                <th>Total %</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <PortfolioRow
                  key={holding.symbol}
                  holding={holding}
                  editedHoldings={editedHoldings}
                  handleInputChange={handleInputChange}
                  formatCurrency={formatCurrency}
                  formatPercent={formatPercent}
                  collapsibleColumns={collapsibleColumns}
                  isColumnVisible={isColumnVisible}
                />
              ))}
              {/* Totals Row */}
              <tr className="totals-row">
                <td>
                  <strong>TOTALS:</strong>
                </td>
                <td>-</td>
                {collapsibleColumns.map((columnKey) =>
                  isColumnVisible(columnKey) ? (
                    <td key={columnKey}>
                      {columnKey === "totalSpent" && (
                        <strong>{formatCurrency(totalSpent)}</strong>
                      )}
                      {columnKey === "totalValue" && (
                        <strong>{formatCurrency(totalValue)}</strong>
                      )}
                      {columnKey !== "totalSpent" &&
                        columnKey !== "totalValue" &&
                        "-"}
                    </td>
                  ) : (
                    <td key={columnKey} className="collapsed-cell">
                      <div className="collapsed-data">•</div>
                    </td>
                  )
                )}
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td className={unrealizedPL >= 0 ? "positive" : "negative"}>
                  <strong>{formatCurrency(unrealizedPL)}</strong>
                </td>
                <td
                  className={unrealizedPLPercent >= 0 ? "positive" : "negative"}
                >
                  <strong>{formatPercent(unrealizedPLPercent)}</strong>
                </td>
                <td>
                  <strong>100.00%</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h2>No Holdings Yet</h2>
          <p>Start investing by adding your first transaction!</p>
        </div>
      )}
    </div>
  );
}

export default Portfolio;
