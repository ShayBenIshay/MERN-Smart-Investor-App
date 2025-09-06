import React, { useState, useEffect, useCallback } from "react";
import { useDebouncedPrice } from "../hooks/useDebouncedPrice";
import "./TransactionRow.css";

const TransactionRow = React.memo(
  ({
    index,
    row,
    onUpdate,
    onRemove,
    canRemove,
    isLastRow,
    onAddRow,
    canAddRow,
  }) => {
    const [tickerValue, setTickerValue] = useState(row.ticker);
    const { price, loading, error } = useDebouncedPrice(tickerValue);

    // Auto-fill price when real-time price is available
    useEffect(() => {
      if (price && tickerValue && row.price !== price.toFixed(2)) {
        onUpdate(row.id, "price", price.toFixed(2));
      }
    }, [price, tickerValue, row.id, row.price, onUpdate]);

    const handleTickerChange = useCallback(
      (e) => {
        const value = e.target.value.toUpperCase();
        onUpdate(row.id, "ticker", value);
        setTickerValue(value);
      },
      [onUpdate, row.id]
    );

    const handleFieldChange = useCallback(
      (field, value) => {
        onUpdate(row.id, field, value);
      },
      [onUpdate, row.id]
    );

    // Calculate total value
    const totalValue =
      row.price && row.papers
        ? (parseFloat(row.price) * parseInt(row.papers)).toFixed(2)
        : "0.00";

    return (
      <div className="transaction-row">
        <div className="row-number">#{index + 1}</div>

        <div className="row-content">
          <div className="field-group">
            <label>Operation</label>
            <select
              value={row.operation}
              onChange={(e) => handleFieldChange("operation", e.target.value)}
              className="operation-select"
            >
              <option value="buy">BUY</option>
              <option value="sell">SELL</option>
            </select>
          </div>

          <div className="field-group">
            <label>Ticker</label>
            <div className="ticker-input-container">
              <input
                type="text"
                value={row.ticker}
                onChange={handleTickerChange}
                placeholder="e.g., AAPL"
                className="ticker-input"
                style={{ textTransform: "uppercase" }}
              />
              {loading && (
                <div className="price-loading">
                  <span className="spinner"></span>
                </div>
              )}
              {price && !loading && (
                <div className="current-price">${price.toFixed(2)}</div>
              )}
              {error && !loading && (
                <div className="price-error">Not found</div>
              )}
            </div>
          </div>

          <div className="field-group">
            <label>Shares</label>
            <input
              type="number"
              value={row.papers}
              onChange={(e) => handleFieldChange("papers", e.target.value)}
              placeholder="1"
              min="1"
              className="shares-input"
            />
          </div>

          <div className="field-group">
            <label>Price/Share</label>
            <input
              type="number"
              value={row.price}
              onChange={(e) => handleFieldChange("price", e.target.value)}
              placeholder={price ? price.toFixed(2) : "0.00"}
              step="0.01"
              min="0.01"
              className="price-input"
            />
          </div>

          <div className="field-group">
            <label>Total Value</label>
            <div className="total-value-display">${totalValue}</div>
          </div>

          <div className="field-group">
            <label>Date</label>
            <input
              type="date"
              value={row.executedAt}
              onChange={(e) => handleFieldChange("executedAt", e.target.value)}
              className="date-input"
            />
          </div>

          <div className="field-group action-group">
            {isLastRow && canAddRow && (
              <button
                type="button"
                onClick={onAddRow}
                className="add-button"
                title="Add transaction"
              >
                +
              </button>
            )}
            {canRemove && (
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                className="remove-button"
                title="Remove transaction"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

TransactionRow.displayName = "TransactionRow";

export default TransactionRow;
