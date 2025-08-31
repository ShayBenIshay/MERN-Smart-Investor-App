// import React from "react";
// import { usePortfolioSummary, usePortfolio } from "../hooks/usePortfolio";

// function Portfolio() {
//   const {
//     totalHoldings,
//     totalValue,
//     totalInvested,
//     totalGainLoss,
//     totalGainLossPercentage,
//     topHolding,
//     isLoading: summaryLoading,
//   } = usePortfolioSummary();

//   const { holdingsArray, isLoading: portfolioLoading, error } = usePortfolio();

//   if (summaryLoading || portfolioLoading) {
//     return (
//       <div className="page">
//         <div className="loading-state">
//           <h1>Loading Portfolio...</h1>
//           <p>Please wait while we fetch your investment data.</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="page">
//         <div className="error-state">
//           <h1>Unable to Load Portfolio</h1>
//           <p>
//             There was an error loading your portfolio data. Please try again.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="page">
//       <h1>Your Portfolio</h1>

//       {/* Portfolio Summary */}
//       <div className="portfolio-summary">
//         <div className="summary-card">
//           <h3>Total Value</h3>
//           <p className="value">${totalValue.toFixed(2)}</p>
//         </div>
//         <div className="summary-card">
//           <h3>Total Invested</h3>
//           <p className="value">${totalInvested.toFixed(2)}</p>
//         </div>
//         <div className="summary-card">
//           <h3>Gain/Loss</h3>
//           <p
//             className={`value ${totalGainLoss >= 0 ? "positive" : "negative"}`}
//           >
//             ${totalGainLoss.toFixed(2)} ({totalGainLossPercentage.toFixed(2)}%)
//           </p>
//         </div>
//         <div className="summary-card">
//           <h3>Holdings</h3>
//           <p className="value">{totalHoldings}</p>
//         </div>
//       </div>

//       {/* Holdings List */}
//       {holdingsArray && holdingsArray.length > 0 ? (
//         <div className="holdings-section">
//           <h2>Your Holdings</h2>
//           <div className="holdings-grid">
//             {holdingsArray.map((holding) => (
//               <div key={holding.ticker} className="holding-card">
//                 <h3>{holding.ticker}</h3>
//                 <div className="holding-details">
//                   <p>Shares: {holding.totalShares}</p>
//                   <p>Avg Price: ${holding.averagePrice.toFixed(2)}</p>
//                   <p>Current Value: ${holding.currentValue.toFixed(2)}</p>
//                   <p>Invested: ${holding.totalInvested.toFixed(2)}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       ) : (
//         <div className="empty-state">
//           <h2>No Holdings Yet</h2>
//           <p>Start investing by adding your first transaction!</p>
//         </div>
//       )}

//       {topHolding && (
//         <div className="top-holding">
//           <h3>Top Holding</h3>
//           <p>
//             {topHolding.ticker} - ${topHolding.currentValue.toFixed(2)}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Portfolio;
