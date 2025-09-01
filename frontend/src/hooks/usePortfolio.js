import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionsAPI } from "../services/api";

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

  transactions.forEach((transaction) => {
    const { ticker, operation, papers, price } = transaction;

    if (!holdingsMap[ticker]) {
      holdingsMap[ticker] = {
        symbol: ticker,
        totalShares: 0,
        totalSpent: 0,
        transactions: [],
      };
    }

    const holding = holdingsMap[ticker];
    holding.transactions.push(transaction);

    if (operation === "buy") {
      holding.totalShares += papers;
      holding.totalSpent += papers * price;
    } else if (operation === "sell") {
      holding.totalShares -= papers;
      holding.totalSpent -= papers * price;
    }
  });

  // Calculate basic metrics for each holding first
  const basicHoldings = Object.values(holdingsMap)
    .filter((holding) => holding.totalShares > 0)
    .map((holding) => {
      const avgBuyPrice = holding.totalSpent / holding.totalShares;
      const mockData = getMockHoldingData(holding.symbol);
      const lastPrice = mockData.price;
      const totalValue = holding.totalShares * lastPrice;
      const unrealizedPL = totalValue - holding.totalSpent;
      const unrealizedPLPercent = (unrealizedPL / holding.totalSpent) * 100;

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
        entryReason: mockData.entryReason,
        stopLoss: mockData.stopLoss,
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
      holding.stopLoss > 0
        ? holding.totalValue - holding.stopLoss * holding.position
        : 0;

    // Risk % = Risk $ as percentage of total portfolio value
    const riskPercent = totalValue > 0 ? (riskDollar / totalValue) * 100 : 0;

    // Total % = This holding's value as percentage of total portfolio
    const totalPercent =
      totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0;

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
      transactionsAPI.getAllWithoutPagination().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Calculate portfolio whenever transactions change
  const portfolioData = useMemo(() => {
    return calculatePortfolio(transactions || []);
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
