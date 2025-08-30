import React from "react";

function Portfolio() {
  return (
    <div className="page">
      <h1>Your Portfolio</h1>
      <p>
        This is the portfolio page. Your investment portfolio and transaction
        history will be displayed here.
      </p>
      <div
        style={{
          marginTop: "2rem",
          padding: "2rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h2>Portfolio Features</h2>
        <ul
          style={{ textAlign: "left", maxWidth: "400px", margin: "1rem auto" }}
        >
          <li>Holdings overview</li>
          <li>Transaction history</li>
          <li>Performance metrics</li>
          <li>Buy/Sell functionality</li>
          <li>Real-time stock prices</li>
        </ul>
      </div>
    </div>
  );
}

export default Portfolio;
