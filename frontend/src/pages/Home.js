import React, { useState } from "react";
import AddTransactionForm from "../components/AddTransactionForm";
import { useAuth } from "../context/AuthContext";
import { getDisplayName } from "../utils/userUtils";

function Home() {
  const { user } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState([]);

  const handleTransactionAdded = (newTransaction) => {
    setRecentTransactions((prev) => [newTransaction, ...prev.slice(0, 4)]); // Keep only last 5
  };

  return (
    <div className="page">
      <h1>Hi {getDisplayName(user)}, Welcome to Smart Investor</h1>
      <p>Track your investments and manage your portfolio with ease.</p>

      {/* Add Transaction Form */}
      <AddTransactionForm onTransactionAdded={handleTransactionAdded} />

      {/* Recent Transactions Preview */}
      {recentTransactions.length > 0 && (
        <div
          style={{
            marginTop: "2rem",
            padding: "2rem",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            maxWidth: "600px",
            margin: "2rem auto 0",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#1f2937" }}>
            Recent Transactions
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {recentTransactions.map((transaction, index) => (
              <div
                key={index}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: "500" }}>
                  {transaction.operation.toUpperCase()} {transaction.papers}{" "}
                  {transaction.ticker}
                </span>
                <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  ${transaction.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon Section */}
      <div
        style={{
          marginTop: "2rem",
          padding: "2rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          maxWidth: "600px",
          margin: "2rem auto 0",
        }}
      >
        <h2>Coming Soon</h2>
        <ul
          style={{ textAlign: "left", maxWidth: "400px", margin: "1rem auto" }}
        >
          <li>Batch transactions updates</li>
          <li>Market news and updates</li>
          <li>Performance analytics</li>
          <li>Multiple Portfolios</li>
          <li>Agent recommendations</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
