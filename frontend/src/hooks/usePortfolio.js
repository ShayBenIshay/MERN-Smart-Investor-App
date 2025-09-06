import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionsAPI } from "../services/api";

// Note: Real-time prices are now handled via WebSocket subscriptions
// This hook calculates portfolio using mock prices initially

// Calculate portfolio from transactions
const calculatePortfolio = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      holdings: [],
      totalSpent: 0,
      totalValue: 0,
      unrealizedPL: 0,
      unrealizedPLPercent: 0,
    };
  }

  // Group transactions by ticker
  const holdingsMap = {};

  // Sort transactions by date to ensure FIFO processing
  transactions.sort((a, b) => new Date(a.executedAt) - new Date(b.executedAt));

  transactions.forEach((transaction, index) => {
    const { ticker, operation, papers, price } = transaction;

    // Convert price to number safely (handles Decimal128)
    const numericPrice =
      typeof price === "number"
        ? price
        : price?.$numberDecimal
        ? parseFloat(price.$numberDecimal)
        : parseFloat(price) || 0;
    const numericPapers = parseInt(papers) || 0;

    if (ticker === "SMCI") {
      console.log(`SMCI Transaction #${index + 1}:`, {
        operation,
        papers: numericPapers,
        executedAt: transaction.executedAt,
        timestamp: new Date(transaction.executedAt).getTime(),
        rawTransaction: transaction,
      });
    }

    // Debug logging for problematic transactions
    if (isNaN(numericPrice) || isNaN(numericPapers)) {
      console.warn("Invalid transaction data:", {
        ticker,
        operation,
        papers,
        price,
        numericPrice,
        numericPapers,
      });
    }

    if (ticker === "SMCI")
      console.log("SMCI price conversion:", {
        price,
        numericPrice,
        papers,
        numericPapers,
      });

    if (!holdingsMap[ticker]) {
      holdingsMap[ticker] = {
        symbol: ticker,
        totalShares: 0,
        totalSpent: 0,
        transactions: [],
        buyLots: [], // New: Track individual buy lots
      };
    }

    const holding = holdingsMap[ticker];
    holding.transactions.push(transaction);

    // FIFO accounting - track individual buy lots
    if (operation === "buy") {
      holding.buyLots.push({
        shares: numericPapers,
        pricePerShare: numericPrice,
        date: transaction.executedAt,
      });
      holding.totalShares += numericPapers;
      holding.totalSpent += numericPapers * numericPrice;

      if (ticker === "SMCI") {
        console.log("SMCI BUY:", {
          shares: numericPapers,
          totalSharesAfter: holding.totalShares,
          totalSpentAfter: holding.totalSpent,
        });
      }
    } else if (operation === "sell") {
      let sharesToSell = numericPapers;
      let costBasisOfSoldShares = 0;

      // Sell from oldest lots first (FIFO)
      while (sharesToSell > 0 && holding.buyLots.length > 0) {
        const oldestLot = holding.buyLots[0];

        if (oldestLot.shares <= sharesToSell) {
          // Sell entire lot
          sharesToSell -= oldestLot.shares;
          costBasisOfSoldShares += oldestLot.shares * oldestLot.pricePerShare;
          holding.buyLots.shift(); // Remove entire lot
        } else {
          // Partially sell from this lot
          costBasisOfSoldShares += sharesToSell * oldestLot.pricePerShare;
          oldestLot.shares -= sharesToSell;
          sharesToSell = 0;
        }
      }

      holding.totalShares -= numericPapers;
      holding.totalSpent -= costBasisOfSoldShares;

      if (ticker === "SMCI") {
        console.log("SMCI SELL:", {
          sharesToSellOriginal: numericPapers,
          costBasisOfSoldShares,
          totalSharesBefore: holding.totalShares + numericPapers,
          totalSharesAfter: holding.totalShares,
          totalSpentBefore: holding.totalSpent + costBasisOfSoldShares,
          totalSpentAfter: holding.totalSpent,
        });
      }
    }
  });

  // Debug: Log final position for SMCI
  if (holdingsMap["SMCI"]) {
    console.log("SMCI FINAL POSITION:", {
      totalShares: holdingsMap["SMCI"].totalShares,
      totalSpent: holdingsMap["SMCI"].totalSpent,
      buyLots: holdingsMap["SMCI"].buyLots,
      transactionCount: holdingsMap["SMCI"].transactions.length,
    });
  }

  // Get unique symbols for price fetching
  const symbols = Object.keys(holdingsMap).filter(
    (symbol) => holdingsMap[symbol].totalShares > 0
  );

  // Calculate basic metrics for each holding without prices first
  const basicHoldings = Object.values(holdingsMap)
    .filter((holding) => holding.totalShares > 0)
    .map((holding) => {
      // Safe division with fallbacks to prevent NaN
      const avgBuyPrice =
        holding.totalShares > 0 ? holding.totalSpent / holding.totalShares : 0;

      const mockData = getMockHoldingData(holding.symbol);

      // Use mock price for now - prices will be updated via real-time subscriptions
      const lastPrice = mockData.price || 0;

      const totalValue = holding.totalShares * lastPrice;
      const unrealizedPL = totalValue - holding.totalSpent;

      // Safe percentage calculation to prevent NaN
      const unrealizedPLPercent =
        holding.totalSpent > 0 ? (unrealizedPL / holding.totalSpent) * 100 : 0;

      return {
        symbol: holding.symbol,
        avgBuyPrice,
        position: holding.totalShares,
        lastPrice,
        totalSpent: holding.totalSpent,
        totalValue,
        unrealizedPL,
        unrealizedPLPercent,
        realizedPL: 0,
        entryReason: mockData.entryReason || "",
        stopLoss: mockData.stopLoss || 0,
      };
    });

  // Calculate portfolio totals
  const totalSpent = basicHoldings.reduce((sum, h) => sum + h.totalSpent, 0);
  const totalValue = basicHoldings.reduce((sum, h) => sum + h.totalValue, 0);
  const unrealizedPL = totalValue - totalSpent;
  const unrealizedPLPercent =
    totalSpent > 0 ? (unrealizedPL / totalSpent) * 100 : 0;

  // Now calculate risk and portfolio percentage for each holding
  const holdings = basicHoldings.map((holding) => {
    // Risk $ = (totalValue - stopLoss * position) if stopLoss > 0
    const riskDollar =
      holding.stopLoss > 0 && holding.position > 0
        ? Math.max(0, holding.totalValue - holding.stopLoss * holding.position)
        : 0;

    // Risk % = Risk $ as percentage of total portfolio value
    const riskPercent = totalValue > 0 ? (riskDollar / totalValue) * 100 : 0;

    // Total % = This holding's value as percentage of total portfolio
    const totalPercent =
      totalValue > 0 && holding.totalValue > 0
        ? (holding.totalValue / totalValue) * 100
        : 0;

    return {
      ...holding,
      riskDollar,
      riskPercent,
      totalPercent,
    };
  });

  return {
    holdings,
    totalSpent,
    totalValue,
    unrealizedPL,
    unrealizedPLPercent,
  };
};

export const usePortfolio = () => {
  // Get all transactions without pagination for portfolio calculations
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions", "all"],
    queryFn: () =>
      transactionsAPI.getAllWithoutPagination().then((res) => {
        console.log(
          "Portfolio transactions fetched:",
          res.data.data?.length || 0,
          "transactions"
        );
        return res.data.data;
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Subscribe to portfolio symbols when transactions change
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const symbols = [...new Set(transactions.map((t) => t.ticker))];
      if (symbols.length > 0) {
        // Subscribe to portfolio symbols
        transactionsAPI.subscribeToPortfolio(symbols);
      }
    }
  }, [transactions]);

  // Calculate portfolio whenever transactions change
  const portfolioData = useMemo(() => {
    if (!transactions) {
      console.log("Portfolio calculation: No transactions data");
      return {
        holdings: [],
        totalSpent: 0,
        totalValue: 0,
        unrealizedPL: 0,
        unrealizedPLPercent: 0,
      };
    }

    console.log(
      "Portfolio calculation: Processing",
      transactions.length,
      "transactions"
    );
    // Calculate portfolio synchronously
    const result = calculatePortfolio(transactions);
    console.log(
      "Portfolio calculation result:",
      result.holdings.length,
      "holdings"
    );
    return result;
  }, [transactions]);

  return {
    ...portfolioData,
    isLoading,
    error,
  };
};

// Mock data with entry reasons and stop losses from CSV
const getMockHoldingData = (symbol) => {
  const holdingData = {
    TSLA: { price: 333.86, entryReason: "טסלה - לא מוכר", stopLoss: 268.0 },
    NVDA: { price: 174.11, entryReason: "", stopLoss: 0 },
    META: { price: 738.7, entryReason: "", stopLoss: 671.8 },
    PLTR: { price: 156.71, entryReason: "", stopLoss: 0 },
    RGTI: {
      price: 16.23,
      entryReason: "סטופ מתחת לתמיכה ב13.5$",
      stopLoss: 13.47,
    },
    INVZ: {
      price: 1.67,
      entryReason: "סטופ גמיש לPenny סטוק וולטילי - להדק אחרי עליות",
      stopLoss: 0.79,
    },
    BMNR: { price: 43.62, entryReason: "", stopLoss: 0 },
    ETHA: { price: 32.82, entryReason: "", stopLoss: 25.1 },
  };
  return holdingData[symbol] || { price: 100, entryReason: "", stopLoss: 0 };
};
