import React, { useState, useEffect } from "react";
import { usePortfolio } from "../hooks/usePortfolio";
import "./Portfolio.css";

function Portfolio() {
  const {
    holdings,
    totalSpent,
    totalValue,
    unrealizedPL,
    unrealizedPLPercent,
    isLoading,
    error,
  } = usePortfolio();

  // State for editable values
  const [editedHoldings, setEditedHoldings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // State for collapsed columns
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());

  // Initialize edited holdings when data loads
  useEffect(() => {
    if (holdings.length > 0) {
      const initialValues = {};
      holdings.forEach((holding) => {
        initialValues[holding.symbol] = {
          stopLoss: holding.stopLoss || 0,
          entryReason: holding.entryReason || "",
        };
      });
      setEditedHoldings(initialValues);
    }
  }, [holdings]);

  // Handle input changes
  const handleInputChange = (symbol, field, value) => {
    setEditedHoldings((prev) => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        [field]: field === "stopLoss" ? parseFloat(value) || 0 : value,
      },
    }));
    setHasChanges(true);
  };

  // Handle update
  const handleUpdate = async () => {
    try {
      // TODO: Call API to update holdings
      console.log("Updating holdings:", editedHoldings);
      setHasChanges(false);
      // Show success message
    } catch (error) {
      console.error("Error updating holdings:", error);
      // Show error message
    }
  };

  // Toggle collapse/expand for a column
  const toggleColumnCollapse = (columnKey) => {
    setCollapsedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="loading-state">
          <h1>Loading Portfolio...</h1>
          <p>Please wait while we fetch your investment data.</p>
        </div>
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

  const formatCurrency = (value) =>
    `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const formatPercent = (value) => `${value.toFixed(2)}%`;

  // Define collapsible columns
  const collapsibleColumns = [
    "position",
    "lastPrice",
    "totalSpent",
    "totalValue",
    "stopLoss",
    "riskDollar",
    "riskPercent",
    "entryReason",
  ];

  // Helper function to check if column is visible
  const isColumnVisible = (columnKey) => !collapsedColumns.has(columnKey);

  // Get abbreviated column titles for collapsed state
  const getColumnAbbreviation = (columnKey) => {
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
  };

  // Toggle all columns collapse/expand
  const toggleAllColumns = () => {
    if (collapsedColumns.size === 0) {
      // Collapse all
      setCollapsedColumns(new Set(collapsibleColumns));
    } else {
      // Expand all
      setCollapsedColumns(new Set());
    }
  };

  return (
    <div className="page">
      <h1>Your Portfolio</h1>

      {holdings.length > 0 ? (
        <div className="portfolio-container">
          <div className="portfolio-controls">
            <button onClick={toggleAllColumns} className="toggle-all-button">
              {collapsedColumns.size === 0 ? "▼ Collapse All" : "▶ Expand All"}
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
                      {columnKey === "lastPrice" && "Last Price"}
                      {columnKey === "totalSpent" && "Total Spent"}
                      {columnKey === "totalValue" && "Total Value"}
                      {columnKey === "stopLoss" && "Stop Loss $"}
                      {columnKey === "riskDollar" && "Risk $"}
                      {columnKey === "riskPercent" && "Risk %"}
                      {columnKey === "entryReason" && "Entry Reason"}
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
                <th>Unrealized P&L $</th>
                <th>Unrealized P&L %</th>
                <th>Total %</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.symbol} className="portfolio-row">
                  <td className="symbol">{holding.symbol}</td>
                  <td>{formatCurrency(holding.avgBuyPrice)}</td>
                  {collapsibleColumns.map((columnKey) =>
                    isColumnVisible(columnKey) ? (
                      <td key={columnKey}>
                        {columnKey === "position" &&
                          holding.position.toLocaleString()}
                        {columnKey === "lastPrice" &&
                          formatCurrency(holding.lastPrice)}
                        {columnKey === "totalSpent" &&
                          formatCurrency(holding.totalSpent)}
                        {columnKey === "totalValue" &&
                          formatCurrency(holding.totalValue)}
                        {columnKey === "stopLoss" && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={
                              editedHoldings[holding.symbol]?.stopLoss || 0
                            }
                            onChange={(e) =>
                              handleInputChange(
                                holding.symbol,
                                "stopLoss",
                                e.target.value
                              )
                            }
                            className="editable-input currency-input"
                          />
                        )}
                        {columnKey === "riskDollar" && (
                          <span
                            className={holding.riskDollar > 0 ? "negative" : ""}
                          >
                            {holding.riskDollar > 0
                              ? formatCurrency(holding.riskDollar)
                              : "-"}
                          </span>
                        )}
                        {columnKey === "riskPercent" && (
                          <span
                            className={
                              holding.riskPercent > 0 ? "negative" : ""
                            }
                          >
                            {holding.riskPercent > 0
                              ? formatPercent(holding.riskPercent)
                              : "-"}
                          </span>
                        )}
                        {columnKey === "entryReason" && (
                          <input
                            type="text"
                            value={
                              editedHoldings[holding.symbol]?.entryReason || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                holding.symbol,
                                "entryReason",
                                e.target.value
                              )
                            }
                            className="editable-input text-input"
                          />
                        )}
                      </td>
                    ) : (
                      <td key={columnKey} className="collapsed-cell">
                        <div className="collapsed-data">•</div>
                      </td>
                    )
                  )}
                  <td
                    className={
                      holding.unrealizedPL >= 0 ? "positive" : "negative"
                    }
                  >
                    {formatCurrency(holding.unrealizedPL)}
                  </td>
                  <td
                    className={
                      holding.unrealizedPLPercent >= 0 ? "positive" : "negative"
                    }
                  >
                    {formatPercent(holding.unrealizedPLPercent)}
                  </td>
                  <td>{formatPercent(holding.totalPercent)}</td>
                </tr>
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
